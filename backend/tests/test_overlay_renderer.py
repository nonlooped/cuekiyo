from pathlib import Path
from unittest.mock import patch

from app.services.overlay_renderer import (
    OverlayContent,
    build_drawtext_filter,
    build_overlay_content,
    check_overlay_support,
)


def test_build_overlay_content():
    content = build_overlay_content("Naruto", "opening", 1, "Rocks", 12345, "Uploader")
    assert content.anime_name == "Naruto"
    assert content.song_line.startswith("OP1:")
    assert "12,345 views" in content.meta_line


def test_build_drawtext_filter_uses_textfiles(tmp_path):
    files = {
        "anime": tmp_path / "anime.txt",
        "song": tmp_path / "song.txt",
        "meta": tmp_path / "meta.txt",
    }
    for key, path in files.items():
        path.write_text(key, encoding="utf-8")

    filt = build_drawtext_filter(files, 1920, 1080, "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf")
    assert "drawbox" in filt
    assert "drawtext" in filt
    assert "textfile=" in filt
    assert filt.endswith("[v]")


def test_check_overlay_support():
    with patch("app.services.overlay_renderer._check_ffmpeg_drawtext", return_value=(True, "ok")):
        with patch("app.services.overlay_renderer.resolve_font", return_value="/fonts/DejaVuSans-Bold.ttf"):
            ok, detail = check_overlay_support()
            assert ok is True
            assert "DejaVu" in detail
