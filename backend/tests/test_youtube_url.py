import pytest

from app.services.youtube_url import parse_youtube_id, normalize_youtube_url


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://youtu.be/dQw4w9WgXcQ?t=30", "dQw4w9WgXcQ"),
        ("https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://example.com/not-youtube", None),
        ("", None),
    ],
)
def test_parse_youtube_id(raw, expected):
    assert parse_youtube_id(raw) == expected


def test_normalize_youtube_url():
    assert normalize_youtube_url("https://youtu.be/abc12345678") == "https://www.youtube.com/watch?v=abc12345678"
