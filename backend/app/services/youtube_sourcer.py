import json
import logging
import math
import re
import subprocess
import urllib.parse
import threading
import time
from collections.abc import Callable
from contextlib import contextmanager
from dataclasses import dataclass, field
from pathlib import Path

from app.config import settings
from app.exceptions import CancelledJob

logger = logging.getLogger(__name__)

REJECT_KEYWORDS = [
    "remix",
    "cover",
    "nightcore",
    "slowed",
    "reverb",
    "live",
    "piano",
    "instrumental",
    "reaction",
    "amv",
    "edit",
    "1 hour",
    "extended",
    "loop",
    "karaoke",
    "shorts",
    "#shorts",
]

# Soft penalties only — lyrics uploads are often the best official opening uploads.
SOFT_PENALTY_KEYWORDS = [
    "lyrics",
]

SHORTS_MAX_DURATION = 60.0
IDEAL_MIN_DURATION = 60.0
IDEAL_MAX_DURATION = 240.0
SEARCH_RESULTS_PER_QUERY = 25
SHORT_SONG_TITLE_MAX_TOKENS = 2

SONG_TITLE_STOP_TOKENS = frozenset(
    {
        "opening",
        "op",
        "ending",
        "ed",
        "official",
        "creditless",
        "mv",
        "video",
        "music",
        "anime",
        "hd",
        "4k",
        "by",
        "the",
        "a",
        "tv",
        "size",
        "full",
        "feat",
        "ft",
        "ver",
        "version",
    }
)

HARD_REJECTION_FLAGS = {
    "remix",
    "cover",
    "nightcore",
    "slowed",
    "reverb",
    "live",
    "piano",
    "instrumental",
    "reaction",
    "amv",
    "edit",
    "1 hour",
    "extended",
    "loop",
    "karaoke",
    "shorts",
    "#shorts",
    "shorts_duration",
}

TRUSTED_UPLOADERS = (
    "aniplex",
    "anime pony canyon",
    "animelab",
    "crunchyroll",
    "funimation",
    "kadokawa",
    "king records",
    "lantis",
    "netflix anime",
    "noitamina",
    "pony canyon",
    "sony music",
    "toho animation",
    "warner bros. japan anime",
)

OFFICIAL_TERMS = (
    "official",
    "official audio",
    "official music video",
    "music video",
    "mv",
    "creditless",
    "opening movie",
    "ending movie",
)

COVER_PHRASES = (
    "english cover",
    "full english",
    "english ver",
    "english version",
    "cover by",
    "covered by",
    "piano cover",
)

ANIME_CONTEXT_QUALIFIERS = (
    "junior high",
    "season 2",
    "season 3",
    "season 4",
    "final season",
    "movie",
    "ova",
)

_youtube_semaphore: threading.Semaphore | None = None
_youtube_semaphore_lock = threading.Lock()


def _get_youtube_semaphore() -> threading.Semaphore:
    global _youtube_semaphore
    with _youtube_semaphore_lock:
        if _youtube_semaphore is None:
            workers = max(1, settings.youtube_workers)
            _youtube_semaphore = threading.Semaphore(workers)
        return _youtube_semaphore


@contextmanager
def youtube_slot():
    sem = _get_youtube_semaphore()
    sem.acquire()
    try:
        yield
    finally:
        sem.release()


@dataclass
class CandidateResult:
    youtube_id: str
    url: str
    title: str
    uploader_name: str | None = None
    view_count: int | None = None
    duration: float | None = None
    thumbnail_url: str | None = None
    score: float = 0.0
    rejection_flags: list[str] = field(default_factory=list)
    raw_metadata: dict = field(default_factory=dict)


def _normalize(text: str) -> str:
    return re.sub(r"[^\w\s]", " ", text.lower()).strip()


def _compact(text: str) -> str:
    return " ".join(_normalize(text).split())


def _contains_keyword(text: str, keyword: str) -> bool:
    normalized_text = _compact(text)
    normalized_keyword = _compact(keyword)
    if not normalized_text or not normalized_keyword:
        return False
    pattern = r"(?<!\w)" + r"\s+".join(map(re.escape, normalized_keyword.split())) + r"(?!\w)"
    return re.search(pattern, normalized_text) is not None


def youtube_thumbnail_url(youtube_id: str | None) -> str | None:
    if not youtube_id:
        return None
    return f"https://i.ytimg.com/vi/{youtube_id}/mqdefault.jpg"


def _extract_thumbnail(entry: dict) -> str | None:
    thumb = entry.get("thumbnail")
    if thumb:
        return str(thumb)
    thumbs = entry.get("thumbnails")
    if isinstance(thumbs, list) and thumbs:
        for item in reversed(thumbs):
            if isinstance(item, dict) and item.get("url"):
                return str(item["url"])
    return youtube_thumbnail_url(entry.get("id"))


def _song_tokens(text: str) -> set[str]:
    return {token for token in _normalize(text).split() if token}


def _is_short_song_title(song_title: str) -> bool:
    return len(_song_tokens(song_title)) <= SHORT_SONG_TITLE_MAX_TOKENS


def _allow_bare_song_query(song: str) -> bool:
    if not _is_short_song_title(song):
        return True
    return bool(re.search(r"[^\x00-\x7F]", song))


def _contains_exact_song_phrase(title: str, song_title: str) -> bool:
    song_parts = _compact(song_title).split()
    if not song_parts:
        return False
    phrase = r"\s+".join(map(re.escape, song_parts))
    pattern = rf"(?i)(?<!\w){phrase}(?:\s*[!?.…]+|[/_-]|(?:\s|/|$)(?![a-z]))"
    return re.search(pattern, title) is not None


def _anime_name_matches(text: str, anime_names: list[str]) -> bool:
    for name in anime_names:
        if _contains_keyword(text, name):
            return True
        name_tokens = _song_tokens(name)
        if len(name_tokens) >= 2 and name_tokens.issubset(_song_tokens(text)):
            return True
    return False


def _best_anime_name_match(text: str, anime_names: list[str]) -> float:
    best = 0.0
    for name in anime_names:
        if _contains_keyword(text, name):
            best = max(best, 1.0)
            continue
        overlap = _token_overlap(text, name)
        name_tokens = _song_tokens(name)
        if len(name_tokens) >= 2 and name_tokens.issubset(_song_tokens(text)):
            best = max(best, 1.0)
        else:
            best = max(best, overlap)
    return best


def _song_title_matches(
    title: str,
    song_titles: list[str],
    *,
    blob: str | None = None,
    anime_names: list[str] | None = None,
) -> bool:
    texts = [title]
    if blob:
        texts.append(blob)
    for text in texts:
        title_tokens = _song_tokens(text)
        for song_title in song_titles:
            song_tokens = _song_tokens(song_title)
            if not song_tokens:
                continue
            overlap = song_tokens & title_tokens
            coverage = len(overlap) / len(song_tokens)
            if coverage < 0.67:
                continue
            if not _is_short_song_title(song_title):
                return True
            if _contains_exact_song_phrase(text, song_title):
                return True
            if anime_names and _anime_name_matches(text, anime_names):
                return True
            extra = title_tokens - song_tokens - SONG_TITLE_STOP_TOKENS
            if not extra:
                return True
    return False


def _best_song_title_match(
    title: str,
    song_titles: list[str],
    *,
    blob: str | None = None,
    anime_names: list[str] | None = None,
) -> float:
    best = 0.0
    for song_title in song_titles:
        best = max(best, _song_token_coverage(title, song_title))
        if blob:
            best = max(best, _song_token_coverage(blob, song_title))
    if _song_title_matches(title, song_titles, blob=blob, anime_names=anime_names):
        return max(best, 0.67)
    if _is_short_song_title(song_titles[0]) and best >= 0.67:
        return min(best, 0.66)
    return best


def _song_token_coverage(title: str, song_title: str) -> float:
    song_tokens = _song_tokens(song_title)
    if not song_tokens:
        return 0.0
    title_tokens = _song_tokens(title)
    return len(song_tokens & title_tokens) / len(song_tokens)


def _text_options(primary: str, aliases: list[str] | None = None) -> list[str]:
    seen: set[str] = set()
    options: list[str] = []
    for value in [primary, *(aliases or [])]:
        display = " ".join(str(value).split())
        key = display.casefold()
        if not display or key in seen:
            continue
        seen.add(key)
        options.append(display)
    return options


def _best_song_token_coverage(title: str, song_titles: list[str]) -> float:
    return max((_song_token_coverage(title, song_title) for song_title in song_titles), default=0.0)


def _best_token_overlap(text: str, options: list[str]) -> float:
    return max((_token_overlap(text, option) for option in options), default=0.0)


def _token_overlap(a: str, b: str) -> float:
    ta = set(_normalize(a).split())
    tb = set(_normalize(b).split())
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / min(len(ta), len(tb))


def _text_blob(entry: dict) -> str:
    fields = (
        entry.get("title"),
        entry.get("description"),
        entry.get("uploader"),
        entry.get("channel"),
        entry.get("uploader_id"),
    )
    return " ".join(str(field) for field in fields if field)


def _has_official_signal(entry: dict) -> bool:
    blob = _text_blob(entry)
    return any(_contains_keyword(blob, term) for term in OFFICIAL_TERMS)


def _has_trusted_uploader(entry: dict, artist: str | None) -> bool:
    uploader = str(entry.get("uploader") or entry.get("channel") or "")
    uploader_normalized = _compact(uploader)
    if not uploader_normalized:
        return False
    if any(_contains_keyword(uploader_normalized, name) for name in TRUSTED_UPLOADERS):
        return True
    if uploader_normalized.endswith(" topic") or " vevo" in uploader_normalized:
        return True
    if artist and _token_overlap(uploader, artist) >= 1.0:
        return True
    return False


def _is_trusted_source(entry: dict, artist: str | None) -> bool:
    if _has_trusted_uploader(entry, artist):
        return True
    return bool(entry.get("channel_is_verified")) and (
        _has_official_signal(entry) or (artist is not None and _token_overlap(_text_blob(entry), artist) >= 1.0)
    )


def build_search_queries(
    anime_name: str,
    song_title: str,
    song_type: str,
    song_number: int,
    artist: str | None,
    *,
    song_aliases: list[str] | None = None,
    anime_aliases: list[str] | None = None,
) -> list[str]:
    op_ed = "OP" if song_type == "opening" else "ED"
    type_word = "opening" if song_type == "opening" else "ending"
    anime_names = _text_options(anime_name, anime_aliases)
    song_titles = _text_options(song_title, song_aliases)
    primary_anime = anime_names[0]
    primary_song = song_titles[0]
    base = [
        f"{primary_anime} {type_word} {song_number} {primary_song}",
        f"{primary_anime} {op_ed} {song_number} {primary_song}",
        f"{primary_anime} {primary_song} {type_word}",
        f"{primary_anime} {op_ed}{song_number} {primary_song}",
        f"{primary_anime} {type_word} {song_number} creditless",
    ]
    for alias in song_titles[1:]:
        base.append(f"{primary_anime} {type_word} {song_number} {alias}")
        if artist:
            base.append(f"{artist} {alias}")
    for alternate_anime in anime_names[1:]:
        base.extend(
            [
                f"{alternate_anime} {type_word} {song_number} {primary_song}",
                f"{alternate_anime} {op_ed}{song_number} {primary_song}",
            ]
        )
    for song in song_titles:
        if _allow_bare_song_query(song):
            base.append(song)
    if artist:
        base.append(f"{primary_anime} {type_word} {song_number} {artist}")
        base.append(f"{primary_anime} {primary_song} {artist}")
        base.append(f"{primary_song} {artist} official")
        base.append(f"{artist} {primary_song}")
    return base


def _extract_sequence_number(title: str, song_type: str) -> int | None:
    title_lower = title.lower()
    if song_type == "opening":
        patterns = (
            r"opening\s*#?\s*(\d+)",
            r"\bop\s*#?\s*(\d+)",
            r"\b(\d+)(?:st|nd|rd|th)\s*(?:opening|op)\b",
        )
    else:
        patterns = (
            r"ending\s*#?\s*(\d+)",
            r"\bed\s*#?\s*(\d+)",
            r"\b(\d+)(?:st|nd|rd|th)\s*(?:ending|ed)\b",
        )
    for pattern in patterns:
        match = re.search(pattern, title_lower)
        if match:
            return int(match.group(1))
    ordinals = {
        "first": 1,
        "second": 2,
        "third": 3,
        "fourth": 4,
        "fifth": 5,
        "sixth": 6,
        "seventh": 7,
        "eighth": 8,
        "ninth": 9,
        "tenth": 10,
    }
    type_words = ("opening", "op") if song_type == "opening" else ("ending", "ed")
    for word, number in ordinals.items():
        if any(re.search(rf"\b{word}\s+{type_alias}\b", title_lower) for type_alias in type_words):
            return number
    return None


def _has_type_context(text: str, song_type: str) -> bool:
    normalized = _compact(text)
    if song_type == "opening":
        return _contains_keyword(normalized, "opening") or _contains_keyword(normalized, "op")
    return _contains_keyword(normalized, "ending") or _contains_keyword(normalized, "ed")


def _has_conflicting_anime_context(title: str, anime_names: list[str]) -> bool:
    normalized_title = _compact(title)
    normalized_anime = _compact(" ".join(anime_names))
    return any(
        qualifier in normalized_title and qualifier not in normalized_anime
        for qualifier in ANIME_CONTEXT_QUALIFIERS
    )


def _dedupe_queries(queries: list[str]) -> list[str]:
    seen: set[str] = set()
    deduped: list[str] = []
    for query in queries:
        display = " ".join(query.split())
        key = display.casefold()
        if not display or key in seen:
            continue
        seen.add(key)
        deduped.append(display)
    return deduped


def _is_relevant_result(
    result: CandidateResult,
    anime_name: str,
    song_title: str,
    artist: str | None,
    song_type: str,
    song_number: int,
    song_aliases: list[str] | None = None,
    anime_aliases: list[str] | None = None,
) -> bool:
    entry = result.raw_metadata
    title = result.title
    blob = _text_blob(entry)
    song_titles = _text_options(song_title, song_aliases)
    anime_names = _text_options(anime_name, anime_aliases)
    title_coverage = _best_song_title_match(title, song_titles, blob=blob, anime_names=anime_names)
    anime_match = _anime_name_matches(blob, anime_names)
    sequence_number = _extract_sequence_number(title, song_type)
    if sequence_number is not None and sequence_number != song_number:
        return False
    if title_coverage >= 0.67 and anime_match:
        return True
    if _has_conflicting_anime_context(title, anime_names):
        return False

    sequence_match = sequence_number == song_number
    artist_match = artist is not None and _token_overlap(blob, artist) >= 1.0
    trusted = _is_trusted_source(entry, artist)
    official = _has_official_signal(entry)
    type_context = _has_type_context(blob, song_type)
    title_song_match = _song_title_matches(title, song_titles, anime_names=anime_names)

    if sequence_match and anime_match and type_context:
        return True
    if artist_match and title_song_match:
        return True
    if sequence_match and anime_match and artist_match and (trusted or official):
        return True
    if sequence_match and anime_match and trusted:
        return True
    if sequence_number is None and anime_match and artist_match and trusted:
        return True
    return False


def _candidate_tier(
    candidate: CandidateResult,
    anime_name: str,
    song_title: str,
    artist: str | None,
    song_type: str,
    song_number: int,
    song_aliases: list[str] | None = None,
    anime_aliases: list[str] | None = None,
) -> int:
    if not _is_relevant_result(
        candidate, anime_name, song_title, artist, song_type, song_number, song_aliases, anime_aliases
    ):
        return 99
    hard_flags = set(candidate.rejection_flags) & HARD_REJECTION_FLAGS
    if hard_flags:
        return 4
    entry = candidate.raw_metadata
    blob = _text_blob(entry)
    anime_names = _text_options(anime_name, anime_aliases)
    anime_match = _anime_name_matches(blob, anime_names)
    sequence_number = _extract_sequence_number(candidate.title, song_type)
    sequence_match = sequence_number == song_number
    type_context = _has_type_context(blob, song_type)
    if (_is_trusted_source(entry, artist) or _has_official_signal(entry)) and anime_match:
        return 0
    if sequence_match and anime_match and type_context:
        return 1
    if _song_title_matches(
        candidate.title,
        _text_options(song_title, song_aliases),
        blob=blob,
        anime_names=anime_names,
    ):
        return 1
    return 2


def _candidate_rank_key(
    candidate: CandidateResult,
    anime_name: str,
    song_title: str,
    artist: str | None,
    song_type: str,
    song_number: int,
    song_aliases: list[str] | None = None,
    anime_aliases: list[str] | None = None,
) -> tuple[int, float, int]:
    tier = _candidate_tier(candidate, anime_name, song_title, artist, song_type, song_number, song_aliases, anime_aliases)
    return (tier, -candidate.score, -(candidate.view_count or 0))


def score_candidate(
    entry: dict,
    anime_name: str,
    song_title: str,
    artist: str | None,
    song_type: str,
    song_number: int,
    song_aliases: list[str] | None = None,
    anime_aliases: list[str] | None = None,
) -> CandidateResult:
    title = entry.get("title") or ""
    title_lower = title.lower()
    blob = _text_blob(entry)
    flags: list[str] = []
    penalty = 0.0
    official = _has_official_signal(entry)
    trusted = _is_trusted_source(entry, artist)

    for kw in REJECT_KEYWORDS:
        if _contains_keyword(title_lower, kw) and kw not in flags:
            flags.append(kw)
            penalty += 35.0

    if not (official or trusted):
        for phrase in COVER_PHRASES:
            if _contains_keyword(blob, phrase) and "cover" not in flags:
                flags.append("cover")
                penalty += 35.0

    for kw in SOFT_PENALTY_KEYWORDS:
        if _contains_keyword(title_lower, kw) and not (official or trusted):
            penalty += 3.0

    duration = entry.get("duration")
    if duration is not None:
        if duration <= SHORTS_MAX_DURATION:
            flags.append("shorts_duration")
            penalty += 25.0
        elif IDEAL_MIN_DURATION <= duration <= IDEAL_MAX_DURATION:
            penalty -= 5.0
        elif duration > 600:
            penalty += 15.0
        elif duration > 360 and not (official or trusted):
            penalty += 5.0

    views = entry.get("view_count") or 0
    view_score = math.log10(max(views, 1)) * 9.0

    song_titles = _text_options(song_title, song_aliases)
    anime_names = _text_options(anime_name, anime_aliases)
    blob_for_match = _text_blob(entry)
    title_coverage = _best_song_title_match(title, song_titles, blob=blob_for_match, anime_names=anime_names)
    title_sim = title_coverage * 35.0
    if title_coverage >= 1.0:
        title_sim += 12.0
    elif title_coverage >= 0.67:
        title_sim += 4.0
    elif title_coverage > 0:
        penalty += 10.0

    anime_sim = _best_anime_name_match(blob_for_match, anime_names) * 18.0
    artist_sim = _token_overlap(blob, artist or "") * 18.0 if artist else 0.0
    type_bonus = 5.0 if _has_type_context(blob, song_type) else 0.0
    source_bonus = 0.0
    if official:
        source_bonus += 14.0
    if trusted:
        source_bonus += 18.0
    if bool(entry.get("channel_is_verified")):
        source_bonus += 8.0

    sequence_bonus = 0.0
    contextual_bonus = 0.0
    sequence_number = _extract_sequence_number(title, song_type)
    anime_match = _anime_name_matches(blob_for_match, anime_names)
    if sequence_number is not None:
        if sequence_number == song_number:
            sequence_bonus = 30.0
            if anime_match and _has_type_context(blob_for_match, song_type) and title_coverage < 0.67:
                contextual_bonus = 42.0
                if official:
                    contextual_bonus += 8.0
            elif trusted and anime_match and title_coverage < 0.67:
                contextual_bonus = 42.0
                if official:
                    contextual_bonus += 8.0
        else:
            penalty += 35.0

    score = (
        title_sim
        + anime_sim
        + artist_sim
        + view_score
        + type_bonus
        + source_bonus
        + sequence_bonus
        + contextual_bonus
        - penalty
    )

    return CandidateResult(
        youtube_id=entry.get("id") or "",
        url=entry.get("webpage_url") or entry.get("url") or "",
        title=title,
        uploader_name=entry.get("uploader") or entry.get("channel"),
        view_count=views if views else None,
        duration=float(duration) if duration is not None else None,
        thumbnail_url=_extract_thumbnail(entry),
        score=score,
        rejection_flags=flags,
        raw_metadata=entry,
    )


def _run_subprocess(
    cmd: list[str],
    *,
    cancel_check: Callable[[], bool] | None = None,
) -> subprocess.CompletedProcess[str]:
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    while proc.poll() is None:
        if cancel_check and cancel_check():
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait()
            raise CancelledJob()
        time.sleep(0.25)
    stdout, stderr = proc.communicate()
    return subprocess.CompletedProcess(cmd, proc.returncode, stdout, stderr)


def yt_dlp_search(query: str, max_results: int = 10) -> list[dict]:
    search_url = f"https://www.youtube.com/results?search_query={urllib.parse.quote_plus(query)}"
    cmd = [
        "yt-dlp",
        search_url,
        "--dump-single-json",
        "--flat-playlist",
        "--no-warnings",
        "--skip-download",
        f"--playlist-end={max_results}",
    ]
    with youtube_slot():
        proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if proc.returncode != 0:
        logger.warning("yt-dlp search failed for query=%r: %s", query, proc.stderr or proc.stdout)
        return []
    try:
        data = json.loads(proc.stdout)
        return data.get("entries") or []
    except json.JSONDecodeError:
        logger.warning("yt-dlp search returned invalid JSON for query=%r", query)
        return []


def source_candidates_for_song(
    anime_name: str,
    song_title: str,
    song_type: str,
    song_number: int,
    artist: str | None,
    top_n: int = 3,
    song_aliases: list[str] | None = None,
    anime_aliases: list[str] | None = None,
) -> list[CandidateResult]:
    seen_ids: set[str] = set()
    scored: list[CandidateResult] = []

    if song_aliases or anime_aliases:
        queries = build_search_queries(
            anime_name,
            song_title,
            song_type,
            song_number,
            artist,
            song_aliases=song_aliases,
            anime_aliases=anime_aliases,
        )
    else:
        queries = build_search_queries(anime_name, song_title, song_type, song_number, artist)
    for query in _dedupe_queries(queries):
        for entry in yt_dlp_search(query, max_results=SEARCH_RESULTS_PER_QUERY):
            vid = entry.get("id")
            if not vid or vid in seen_ids:
                continue
            seen_ids.add(vid)
            result = score_candidate(
                entry, anime_name, song_title, artist, song_type, song_number, song_aliases, anime_aliases
            )
            if result.youtube_id and _is_relevant_result(
                result, anime_name, song_title, artist, song_type, song_number, song_aliases, anime_aliases
            ):
                scored.append(result)

    scored.sort(
        key=lambda c: _candidate_rank_key(c, anime_name, song_title, artist, song_type, song_number, song_aliases, anime_aliases)
    )
    acceptable = [
        c
        for c in scored
        if _candidate_tier(c, anime_name, song_title, artist, song_type, song_number, song_aliases, anime_aliases) < 4
    ]
    pool = acceptable if acceptable else scored
    return pool[:top_n]


def cleanup_download_artifacts(output_path: str | Path) -> None:
    """Remove a song download and any yt-dlp fragments left behind."""
    out = Path(output_path)
    if not out.parent.exists():
        return
    for path in out.parent.glob(f"{out.stem}*"):
        if path.is_file():
            path.unlink(missing_ok=True)


def yt_dlp_download(
    url: str,
    output_path: str,
    *,
    cancel_check: Callable[[], bool] | None = None,
) -> None:
    output_path = str(output_path)
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "yt-dlp",
        url,
        "-f",
        "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--merge-output-format",
        "mp4",
        "-o",
        output_path,
        "--no-playlist",
        "--no-warnings",
    ]
    with youtube_slot():
        proc = _run_subprocess(cmd, cancel_check=cancel_check)
    if proc.returncode != 0:
        cleanup_download_artifacts(out)
        raise RuntimeError(proc.stderr or proc.stdout or "yt-dlp download failed")
    if not out.is_file() or out.stat().st_size == 0:
        cleanup_download_artifacts(out)
        raise RuntimeError(f"Download finished but output missing: {output_path}")


def fetch_heatmap(url: str) -> list[tuple[float, float]] | None:
    """Return list of (timestamp, value) from yt-dlp heatmap if available."""
    cmd = ["yt-dlp", "--dump-json", "--skip-download", url]
    with youtube_slot():
        proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if proc.returncode != 0:
        return None
    try:
        data = json.loads(proc.stdout.splitlines()[-1] if proc.stdout else "{}")
    except (json.JSONDecodeError, IndexError):
        return None
    heatmap = data.get("heatmap") or data.get("heat_map")
    if not heatmap:
        return None
    points: list[tuple[float, float]] = []
    for pt in heatmap:
        if isinstance(pt, dict):
            points.append((float(pt.get("start_time", pt.get("time", 0))), float(pt.get("value", 0))))
        elif isinstance(pt, (list, tuple)) and len(pt) >= 2:
            points.append((float(pt[0]), float(pt[1])))
    return points if points else None
