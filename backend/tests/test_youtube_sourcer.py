from pathlib import Path
from unittest.mock import patch

import pytest

from app.enums import JobType, ProjectStatus
from app.jobs.runner import JobRunner
from app.models import AnimeCache, Job, Project, Song
from app.services import youtube_sourcer


def test_yt_dlp_download_failure_cleans_artifacts(tmp_path):
    output = tmp_path / "clip.mp4"
    (tmp_path / "clip.mp4.part").write_text("partial", encoding="utf-8")
    (tmp_path / "clip.f248.webm.part").write_text("frag", encoding="utf-8")

    with patch.object(
        youtube_sourcer,
        "_run_subprocess",
        return_value=type("Proc", (), {"returncode": 1, "stderr": "", "stdout": ""})(),
    ):
        with pytest.raises(RuntimeError, match="yt-dlp download failed"):
            youtube_sourcer.yt_dlp_download("https://example.com", str(output))

    assert not any(tmp_path.iterdir())


def test_yt_dlp_download_success_requires_output_file(tmp_path):
    output = tmp_path / "clip.mp4"

    with patch.object(
        youtube_sourcer,
        "_run_subprocess",
        return_value=type("Proc", (), {"returncode": 0, "stderr": "", "stdout": ""})(),
    ):
        with pytest.raises(RuntimeError, match="output missing"):
            youtube_sourcer.yt_dlp_download("https://example.com", str(output))


def test_source_candidates_deduplicates_search_queries(monkeypatch):
    from app.services import youtube_sourcer

    calls = []

    def fake_build_queries(anime_name, song_title, song_type, song_number, artist):
        return [
            "Anime Song opening",
            "Anime Song opening",
            " Anime   Song   opening ",
        ]

    def fake_search(query, max_results=10):
        calls.append(query)
        return [
            {
                "id": f"id-{len(calls)}",
                "webpage_url": f"https://youtu.be/id-{len(calls)}",
                "title": "Anime Song Opening",
                "duration": 89,
                "view_count": 1000,
            }
        ]

    monkeypatch.setattr(youtube_sourcer, "build_search_queries", fake_build_queries)
    monkeypatch.setattr(youtube_sourcer, "yt_dlp_search", fake_search)

    results = youtube_sourcer.source_candidates_for_song(
        "Anime",
        "Song",
        "opening",
        1,
        None,
        top_n=3,
    )

    assert len(calls) == 1
    assert calls == ["Anime Song opening"]
    assert len(results) == 1


def test_source_candidates_orders_top_results_by_view_count(monkeypatch):
    entries = [
        {
            "id": "low-views",
            "webpage_url": "https://youtu.be/low-views",
            "title": "Anime Song Opening",
            "duration": 89,
            "view_count": 1000,
        },
        {
            "id": "high-views",
            "webpage_url": "https://youtu.be/high-views",
            "title": "Anime Song Opening",
            "duration": 89,
            "view_count": 5_000_000,
        },
        {
            "id": "mid-views",
            "webpage_url": "https://youtu.be/mid-views",
            "title": "Anime Song Opening",
            "duration": 89,
            "view_count": 250_000,
        },
    ]
    call_count = {"n": 0}

    def fake_search(query, max_results=10):
        call_count["n"] += 1
        return entries

    monkeypatch.setattr(youtube_sourcer, "build_search_queries", lambda *args, **kwargs: ["Anime Song opening"])
    monkeypatch.setattr(youtube_sourcer, "yt_dlp_search", fake_search)

    results = youtube_sourcer.source_candidates_for_song(
        "Anime",
        "Song",
        "opening",
        1,
        None,
        top_n=3,
    )

    assert call_count["n"] == 1
    assert [r.youtube_id for r in results] == ["high-views", "mid-views", "low-views"]


def test_source_candidates_prefers_score_over_view_count(monkeypatch):
    entries = [
        {
            "id": "wrong-op",
            "webpage_url": "https://youtu.be/wrong-op",
            "title": "One Piece Opening 20 | Hope by Namie Amuro",
            "duration": 89,
            "view_count": 44_000_000,
        },
        {
            "id": "correct-op",
            "webpage_url": "https://youtu.be/correct-op",
            "title": "One Piece Opening 1 | We Are! by Hiroshi Kitadani",
            "duration": 89,
            "view_count": 5_000_000,
        },
        {
            "id": "alternate",
            "webpage_url": "https://youtu.be/alternate",
            "title": "Hiroshi Kitadani - We Are! / THE FIRST TAKE",
            "duration": 89,
            "view_count": 21_000_000,
        },
    ]

    monkeypatch.setattr(
        youtube_sourcer,
        "build_search_queries",
        lambda *args, **kwargs: ["One Piece opening 1 We Are!"],
    )
    monkeypatch.setattr(youtube_sourcer, "yt_dlp_search", lambda query, max_results=10: entries)

    results = youtube_sourcer.source_candidates_for_song(
        "One Piece",
        "We Are!",
        "opening",
        1,
        "Hiroshi Kitadani",
        top_n=2,
    )

    assert [r.youtube_id for r in results] == ["correct-op", "alternate"]


def test_source_candidates_excludes_similar_song_titles(monkeypatch):
    entries = [
        {
            "id": "wrong-song",
            "webpage_url": "https://youtu.be/wrong-song",
            "title": "Black Clover Opening 10 | Black Catcher by Vickeblanka",
            "duration": 89,
            "view_count": 44_000_000,
        },
        {
            "id": "correct-song",
            "webpage_url": "https://youtu.be/correct-song",
            "title": "Black Clover Opening 3 | Black Rover by Vickeblanka",
            "duration": 89,
            "view_count": 5_000_000,
        },
    ]

    monkeypatch.setattr(
        youtube_sourcer,
        "build_search_queries",
        lambda *args, **kwargs: ["Black Clover opening 3 Black Rover"],
    )
    monkeypatch.setattr(youtube_sourcer, "yt_dlp_search", lambda query, max_results=10: entries)

    results = youtube_sourcer.source_candidates_for_song(
        "Black Clover",
        "Black Rover",
        "opening",
        3,
        "Vickeblanka",
        top_n=3,
    )

    assert [r.youtube_id for r in results] == ["correct-song"]


def test_source_candidates_excludes_same_song_with_wrong_opening_number(monkeypatch):
    entries = [
        {
            "id": "wrong-number",
            "webpage_url": "https://youtu.be/wrong-number",
            "title": "One Piece Opening 10 We Are! | Creditless | HD",
            "duration": 89,
            "view_count": 50_000_000,
        },
        {
            "id": "correct-number",
            "webpage_url": "https://youtu.be/correct-number",
            "title": "One Piece Opening 1 | We Are! by Hiroshi Kitadani",
            "duration": 89,
            "view_count": 5_000_000,
        },
    ]

    monkeypatch.setattr(
        youtube_sourcer,
        "build_search_queries",
        lambda *args, **kwargs: ["One Piece opening 1 We Are!"],
    )
    monkeypatch.setattr(youtube_sourcer, "yt_dlp_search", lambda query, max_results=25: entries)

    results = youtube_sourcer.source_candidates_for_song(
        "One Piece",
        "We Are!",
        "opening",
        1,
        "Hiroshi Kitadani",
        top_n=3,
    )

    assert [r.youtube_id for r in results] == ["correct-number"]


def test_build_search_queries_includes_bare_song_title():
    queries = youtube_sourcer.build_search_queries(
        "Attack on Titan",
        "Guren no Yumiya",
        "opening",
        1,
        "Linked Horizon",
        song_aliases=["紅蓮の弓矢"],
        anime_aliases=["Shingeki no Kyojin"],
    )

    assert "Guren no Yumiya" in queries
    assert "紅蓮の弓矢" in queries
    assert any("Shingeki no Kyojin opening 1 Guren no Yumiya" == query for query in queries)


def test_source_candidates_prefers_trusted_translation_title(monkeypatch):
    entries = [
        {
            "id": "opening-movie",
            "webpage_url": "https://youtu.be/opening-movie",
            "title": "Attack on Titan Season 1 Part 1 Opening Movie｜Linked Horizon「Guren no Yumiya」",
            "description": "Attack on Titan opening movie for Guren no Yumiya.",
            "uploader": "TOHO animation",
            "channel_is_verified": True,
            "duration": 90,
            "view_count": 4_000_000,
        },
        {
            "id": "german-official",
            "webpage_url": "https://youtu.be/german-official",
            "title": "Attack on Titan Opening 1 | Feuerroter Pfeil und Bogen",
            "description": 'Attack on Titan OP 1 "Feuerroter Pfeil und Bogen" by Linked Horizon.',
            "uploader": "Crunchyroll",
            "channel_is_verified": True,
            "duration": 93,
            "view_count": 60_000_000,
        },
        {
            "id": "female-cover",
            "webpage_url": "https://youtu.be/female-cover",
            "title": "【女性が歌う】紅蓮の弓矢/Linked Horizon「進撃の巨人(ATTACK ON TITAN)」OP(Covered by コバソロ & 未来（ザ・フーパーズ）)",
            "description": "Cover upload.",
            "uploader": "Cover Channel",
            "duration": 89,
            "view_count": 5_000_000,
        },
    ]

    monkeypatch.setattr(
        youtube_sourcer,
        "build_search_queries",
        lambda *args, **kwargs: ["Guren no Yumiya"],
    )
    monkeypatch.setattr(youtube_sourcer, "yt_dlp_search", lambda query, max_results=25: entries)

    results = youtube_sourcer.source_candidates_for_song(
        "Shingeki no Kyojin",
        "Guren no Yumiya",
        "opening",
        1,
        "Linked Horizon",
        top_n=3,
        song_aliases=["紅蓮の弓矢"],
        anime_aliases=["Shingeki no Kyojin", "Attack on Titan"],
    )

    assert [r.youtube_id for r in results] == ["german-official", "opening-movie"]
    assert all("cover" not in r.rejection_flags for r in results)


def test_source_candidates_accepts_trusted_alias_title_over_cover(monkeypatch):
    entries = [
        {
            "id": "popular-official-alias",
            "webpage_url": "https://youtu.be/popular-official-alias",
            "title": "Attack on Titan Opening 1 | Feuerroter Pfeil und Bogen",
            "description": 'Attack on Titan OP 1 "Feuerroter Pfeil und Bogen" by Linked Horizon.',
            "uploader": "Crunchyroll",
            "channel_is_verified": True,
            "duration": 93,
            "view_count": 60_000_000,
        },
        {
            "id": "english-cover",
            "webpage_url": "https://youtu.be/english-cover",
            "title": "ATTACK ON TITAN - Full English Opening 1 (Guren No Yumiya) Cover",
            "description": "English cover of Guren no Yumiya.",
            "uploader": "Cover Singer",
            "duration": 302,
            "view_count": 100_000_000,
        },
    ]

    monkeypatch.setattr(
        youtube_sourcer,
        "build_search_queries",
        lambda *args, **kwargs: ["Attack on Titan opening 1 Guren no Yumiya"],
    )
    monkeypatch.setattr(youtube_sourcer, "yt_dlp_search", lambda query, max_results=25: entries)

    results = youtube_sourcer.source_candidates_for_song(
        "Attack on Titan",
        "Guren no Yumiya",
        "opening",
        1,
        "Linked Horizon",
        top_n=2,
    )

    assert [r.youtube_id for r in results] == ["popular-official-alias"]


def test_source_candidates_accepts_native_title_with_artist_and_context(monkeypatch):
    entries = [
        {
            "id": "native-official",
            "webpage_url": "https://youtu.be/native-official",
            "title": "Linked Horizon - 紅蓮の弓矢",
            "description": "Attack on Titan opening 1 official music video.",
            "uploader": "Linked Horizon",
            "channel_is_verified": True,
            "duration": 90,
            "view_count": 50_000_000,
        },
    ]

    monkeypatch.setattr(
        youtube_sourcer,
        "build_search_queries",
        lambda *args, **kwargs: ["Linked Horizon 紅蓮の弓矢"],
    )
    monkeypatch.setattr(youtube_sourcer, "yt_dlp_search", lambda query, max_results=25: entries)

    results = youtube_sourcer.source_candidates_for_song(
        "Attack on Titan",
        "Guren no Yumiya",
        "opening",
        1,
        "Linked Horizon",
        top_n=3,
    )

    assert [r.youtube_id for r in results] == ["native-official"]


def test_source_candidates_accepts_native_title_alias_without_sequence(monkeypatch):
    entries = [
        {
            "id": "native-official-no-sequence",
            "webpage_url": "https://youtu.be/native-official-no-sequence",
            "title": "Linked Horizon - 紅蓮の弓矢",
            "uploader": "Linked Horizon - Topic",
            "channel_is_verified": True,
            "duration": 310,
            "view_count": 50_000_000,
        },
        {
            "id": "english-cover",
            "webpage_url": "https://youtu.be/english-cover",
            "title": "ATTACK ON TITAN - Full English Opening 1 (Guren No Yumiya) Cover",
            "description": "English cover of Guren no Yumiya.",
            "uploader": "Cover Singer",
            "duration": 302,
            "view_count": 100_000_000,
        },
    ]

    monkeypatch.setattr(
        youtube_sourcer,
        "build_search_queries",
        lambda *args, **kwargs: ["Linked Horizon 紅蓮の弓矢"],
    )
    monkeypatch.setattr(youtube_sourcer, "yt_dlp_search", lambda query, max_results=25: entries)

    results = youtube_sourcer.source_candidates_for_song(
        "Attack on Titan",
        "Guren no Yumiya",
        "opening",
        1,
        "Linked Horizon",
        top_n=3,
        song_aliases=["紅蓮の弓矢"],
    )

    assert [r.youtube_id for r in results] == ["native-official-no-sequence"]


def test_source_candidates_queries_song_aliases(monkeypatch):
    calls: list[str] = []

    monkeypatch.setattr(
        youtube_sourcer,
        "yt_dlp_search",
        lambda query, max_results=25: calls.append(query) or [],
    )

    youtube_sourcer.source_candidates_for_song(
        "Attack on Titan",
        "Guren no Yumiya",
        "opening",
        1,
        "Linked Horizon",
        top_n=3,
        song_aliases=["紅蓮の弓矢"],
    )

    assert any("紅蓮の弓矢" in query for query in calls)


def test_runner_passes_song_and_anime_aliases_to_sourcer(db_session, monkeypatch):
    project = Project(title="Alias Project", status=ProjectStatus.SOURCING.value, song_types='["opening"]')
    db_session.add(project)
    db_session.flush()
    db_session.add(
        AnimeCache(
            mal_id=16498,
            title="Shingeki no Kyojin",
            title_english="Attack on Titan",
            raw_json='{"title_japanese": "進撃の巨人", "title_synonyms": ["AoT"]}',
        )
    )
    song = Song(
        project_id=project.id,
        anime_mal_id=16498,
        anime_name="Attack on Titan",
        song_type="opening",
        song_number=1,
        song_title="Guren no Yumiya",
        artist="Linked Horizon",
        raw_theme_text='1: "Guren no Yumiya" (紅蓮の弓矢) by Linked Horizon',
        render_order=0,
    )
    job = Job(project_id=project.id, type=JobType.SOURCE_CANDIDATES.value, status="running")
    db_session.add_all([song, job])
    db_session.commit()

    captured: list[dict] = []

    def fake_source(*args, **kwargs):
        captured.append(kwargs)
        return []

    def fake_parallel_stage(self, db, job, project, tasks, *, max_workers, worker, on_complete):
        for task in tasks:
            worker(task)

    monkeypatch.setattr(youtube_sourcer, "source_candidates_for_song", fake_source)
    monkeypatch.setattr(JobRunner, "_run_parallel_stage", fake_parallel_stage)

    JobRunner()._run_source_candidates(db_session, job, project)

    assert captured
    assert "紅蓮の弓矢" in captured[0]["song_aliases"]
    assert "Shingeki no Kyojin" in captured[0]["anime_aliases"]
    assert "進撃の巨人" in captured[0]["anime_aliases"]
    assert "AoT" in captured[0]["anime_aliases"]


def test_source_candidates_ignores_description_hashtag_sequence(monkeypatch):
    entries = [
        {
            "id": "hashtag-description",
            "webpage_url": "https://youtu.be/hashtag-description",
            "title": "Anime Opening Song by Artist",
            "description": "Official upload. #5 trending",
            "uploader": "Artist - Topic",
            "channel_is_verified": True,
            "duration": 90,
            "view_count": 10_000_000,
        },
    ]

    monkeypatch.setattr(youtube_sourcer, "build_search_queries", lambda *args, **kwargs: ["Anime opening 1 Song"])
    monkeypatch.setattr(youtube_sourcer, "yt_dlp_search", lambda query, max_results=25: entries)

    results = youtube_sourcer.source_candidates_for_song(
        "Anime",
        "Song",
        "opening",
        1,
        "Artist",
        top_n=3,
    )

    assert [r.youtube_id for r in results] == ["hashtag-description"]


def test_source_candidates_rejects_wrong_official_opening_without_song_match(monkeypatch):
    entries = [
        {
            "id": "wrong-official-opening",
            "webpage_url": "https://youtu.be/wrong-official-opening",
            "title": "Attack on Titan Season 2 - Official Opening Song - Shinzou wo Sasageyo by Linked Horizon",
            "description": "Attack on Titan Season 2 opening by Linked Horizon.",
            "uploader": "animelab",
            "channel_is_verified": True,
            "duration": 90,
            "view_count": 200_000_000,
        },
        {
            "id": "correct-alias",
            "webpage_url": "https://youtu.be/correct-alias",
            "title": "Attack on Titan Opening 1 | Feuerroter Pfeil und Bogen",
            "description": 'Attack on Titan OP 1 "Feuerroter Pfeil und Bogen" by Linked Horizon.',
            "uploader": "Crunchyroll",
            "channel_is_verified": True,
            "duration": 93,
            "view_count": 60_000_000,
        },
    ]

    monkeypatch.setattr(
        youtube_sourcer,
        "build_search_queries",
        lambda *args, **kwargs: ["Attack on Titan opening 1 Guren no Yumiya"],
    )
    monkeypatch.setattr(youtube_sourcer, "yt_dlp_search", lambda query, max_results=25: entries)

    results = youtube_sourcer.source_candidates_for_song(
        "Attack on Titan",
        "Guren no Yumiya",
        "opening",
        1,
        "Linked Horizon",
        top_n=3,
    )

    assert [r.youtube_id for r in results] == ["correct-alias"]


def test_source_candidates_rejects_spinoff_opening_without_song_match(monkeypatch):
    entries = [
        {
            "id": "spinoff",
            "webpage_url": "https://youtu.be/spinoff",
            "title": "Attack on Titan: Junior High - Opening | Seishun wa Hanabi no you ni",
            "description": 'Attack on Titan: Junior High OP 1 "Seishun wa Hanabi no you ni" by Linked Horizon.',
            "uploader": "Crunchyroll",
            "channel_is_verified": True,
            "duration": 90,
            "view_count": 7_000_000,
        },
        {
            "id": "correct-alias",
            "webpage_url": "https://youtu.be/correct-alias",
            "title": "Attack on Titan Opening 1 | Feuerroter Pfeil und Bogen",
            "description": 'Attack on Titan OP 1 "Feuerroter Pfeil und Bogen" by Linked Horizon.',
            "uploader": "Crunchyroll",
            "channel_is_verified": True,
            "duration": 93,
            "view_count": 60_000_000,
        },
    ]

    monkeypatch.setattr(
        youtube_sourcer,
        "build_search_queries",
        lambda *args, **kwargs: ["Attack on Titan opening 1 Guren no Yumiya"],
    )
    monkeypatch.setattr(youtube_sourcer, "yt_dlp_search", lambda query, max_results=25: entries)

    results = youtube_sourcer.source_candidates_for_song(
        "Attack on Titan",
        "Guren no Yumiya",
        "opening",
        1,
        "Linked Horizon",
        top_n=3,
    )

    assert [r.youtube_id for r in results] == ["correct-alias"]


def test_source_candidates_does_not_fill_with_hard_flagged_candidates(monkeypatch):
    entries = [
        {
            "id": "clean",
            "webpage_url": "https://youtu.be/clean",
            "title": "Anime Opening 1 Song by Artist",
            "duration": 90,
            "view_count": 500_000,
        },
        {
            "id": "cover",
            "webpage_url": "https://youtu.be/cover",
            "title": "Anime Opening 1 Song Piano Cover",
            "duration": 90,
            "view_count": 50_000_000,
        },
        {
            "id": "remix",
            "webpage_url": "https://youtu.be/remix",
            "title": "Anime Opening 1 Song Remix",
            "duration": 90,
            "view_count": 40_000_000,
        },
    ]

    monkeypatch.setattr(youtube_sourcer, "build_search_queries", lambda *args, **kwargs: ["Anime Song opening"])
    monkeypatch.setattr(youtube_sourcer, "yt_dlp_search", lambda query, max_results=25: entries)

    results = youtube_sourcer.source_candidates_for_song(
        "Anime",
        "Song",
        "opening",
        1,
        "Artist",
        top_n=3,
    )

    assert [r.youtube_id for r in results] == ["clean"]


def test_yt_dlp_download_success_with_output(tmp_path):
    output = tmp_path / "clip.mp4"
    output.write_bytes(b"video")

    with patch.object(
        youtube_sourcer,
        "_run_subprocess",
        return_value=type("Proc", (), {"returncode": 0, "stderr": "", "stdout": ""})(),
    ):
        youtube_sourcer.yt_dlp_download("https://example.com", str(output))

    assert output.exists()


def test_youtube_thumbnail_url_from_video_id():
    assert (
        youtube_sourcer.youtube_thumbnail_url("abc123")
        == "https://i.ytimg.com/vi/abc123/mqdefault.jpg"
    )
    assert youtube_sourcer.youtube_thumbnail_url(None) is None


def test_score_candidate_falls_back_to_youtube_thumbnail():
    result = youtube_sourcer.score_candidate(
        {
            "id": "abc123",
            "title": "Anime Song Opening",
            "view_count": 1000,
            "duration": 89,
        },
        "Anime",
        "Song",
        None,
        "opening",
        1,
    )
    assert result.thumbnail_url == "https://i.ytimg.com/vi/abc123/mqdefault.jpg"


def test_source_candidates_rejects_we_are_partial_title_matches(monkeypatch):
    entries = [
        {
            "id": "pitbull",
            "webpage_url": "https://youtu.be/pitbull",
            "title": "We Are One (Ole Ola) [The Official 2014 FIFA World Cup Song] (Olodum Mix)",
            "description": "Official FIFA World Cup song by Pitbull.",
            "uploader": "Pitbull",
            "channel_is_verified": True,
            "duration": 93,
            "view_count": 1_023_613_178,
        },
        {
            "id": "lazytown",
            "webpage_url": "https://youtu.be/lazytown",
            "title": "Lazy Town | We are Number One Music Video Videos For Kids",
            "description": "LazyTown music video.",
            "uploader": "LazyTown",
            "channel_is_verified": True,
            "duration": 90,
            "view_count": 172_611_486,
        },
        {
            "id": "correct-op7",
            "webpage_url": "https://youtu.be/correct-op7",
            "title": "One Piece Opening 7 | We Are! by 7-nin no Mugiwara Kaizokudan",
            "description": "One Piece OP7 We Are!",
            "duration": 90,
            "view_count": 5_000_000,
        },
    ]

    monkeypatch.setattr(
        youtube_sourcer,
        "build_search_queries",
        lambda *args, **kwargs: ["One Piece opening 7 We Are!"],
    )
    monkeypatch.setattr(youtube_sourcer, "yt_dlp_search", lambda query, max_results=25: entries)

    results = youtube_sourcer.source_candidates_for_song(
        "One Piece",
        "We Are!",
        "opening",
        7,
        "7-nin no Mugiwara Kaizokudan",
        top_n=3,
        song_aliases=["ウィーアー! 〜7人の麦わら海賊団篇〜"],
    )

    assert [r.youtube_id for r in results] == ["correct-op7"]


def test_source_candidates_accepts_anime_opening_without_song_title(monkeypatch):
    entries = [
        {
            "id": "opening-only-title",
            "webpage_url": "https://youtu.be/opening-only-title",
            "title": "One Piece Opening 2",
            "description": "One Piece second opening.",
            "duration": 90,
            "view_count": 21_000_000,
        },
        {
            "id": "low-views-with-song",
            "webpage_url": "https://youtu.be/low-views-with-song",
            "title": "One Piece OP2 Believe",
            "duration": 90,
            "view_count": 500_000,
        },
    ]

    monkeypatch.setattr(
        youtube_sourcer,
        "build_search_queries",
        lambda *args, **kwargs: ["One Piece opening 2 Believe"],
    )
    monkeypatch.setattr(youtube_sourcer, "yt_dlp_search", lambda query, max_results=25: entries)

    results = youtube_sourcer.source_candidates_for_song(
        "One Piece",
        "Believe",
        "opening",
        2,
        "Folder5",
        top_n=2,
    )

    assert [r.youtube_id for r in results] == ["opening-only-title", "low-views-with-song"]


def test_source_candidates_prefers_high_view_anime_opening_for_bon_voyage(monkeypatch):
    entries = [
        {
            "id": "popular-fan-upload",
            "webpage_url": "https://youtu.be/popular-fan-upload",
            "title": "One Piece - 4th Opening - Bon Voyage",
            "description": "One Piece fourth opening.",
            "duration": 90,
            "view_count": 9_300_000,
        },
        {
            "id": "low-view-upload",
            "webpage_url": "https://youtu.be/low-view-upload",
            "title": "One Piece Opening 4 BON VOYAGE!",
            "duration": 90,
            "view_count": 500_000,
        },
    ]

    monkeypatch.setattr(
        youtube_sourcer,
        "build_search_queries",
        lambda *args, **kwargs: ["One Piece opening 4 BON VOYAGE!"],
    )
    monkeypatch.setattr(youtube_sourcer, "yt_dlp_search", lambda query, max_results=25: entries)

    results = youtube_sourcer.source_candidates_for_song(
        "One Piece",
        "BON VOYAGE!",
        "opening",
        4,
        "Bon-Bon Blanco",
        top_n=2,
    )

    assert [r.youtube_id for r in results] == ["popular-fan-upload", "low-view-upload"]


def test_build_search_queries_omits_bare_short_song_title():
    queries = youtube_sourcer.build_search_queries(
        "One Piece",
        "We Are!",
        "opening",
        7,
        "7-nin no Mugiwara Kaizokudan",
        song_aliases=["ウィーアー! 〜7人の麦わら海賊団篇〜"],
    )

    assert "We Are!" not in queries
    assert any("One Piece opening 7 We Are!" == query for query in queries)


def test_yt_dlp_search_does_not_force_view_count_sort(monkeypatch):
    captured: list[list[str]] = []

    def fake_run(cmd, **kwargs):
        captured.append(cmd)
        return type("Proc", (), {"returncode": 0, "stdout": '{"entries": []}', "stderr": ""})()

    monkeypatch.setattr(youtube_sourcer.subprocess, "run", fake_run)

    youtube_sourcer.yt_dlp_search("Naruto Blue Bird opening", max_results=5)

    assert captured
    search_url = captured[0][1]
    assert search_url.startswith("https://www.youtube.com/results?search_query=")
    assert "sp=CAM" not in search_url
    assert captured[0][-1] == "--playlist-end=5"
