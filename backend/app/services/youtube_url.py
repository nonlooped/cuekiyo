import re

YOUTUBE_ID_PATTERN = re.compile(
    r"(?:youtube\.com/watch\?(?:[^&]*&)*v=|youtu\.be/|youtube\.com/shorts/)([A-Za-z0-9_-]{11})"
)
STANDALONE_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")


def parse_youtube_id(value: str) -> str | None:
    value = value.strip()
    if not value:
        return None
    match = YOUTUBE_ID_PATTERN.search(value)
    if match:
        return match.group(1)
    if STANDALONE_ID_PATTERN.fullmatch(value):
        return value
    return None


def normalize_youtube_url(value: str) -> str | None:
    video_id = parse_youtube_id(value)
    if not video_id:
        return None
    return f"https://www.youtube.com/watch?v={video_id}"
