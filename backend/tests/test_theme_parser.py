from app.enums import SongType
from app.services.theme_parser import parse_theme_line


def test_parse_numbered_theme():
    p = parse_theme_line('1: "Blue Bird" by Ikimonogakari (eps 1-25)', SongType.OPENING)
    assert p is not None
    assert p.song_number == 1
    assert "Blue Bird" in p.song_title
