import pytest

from app.services.ffmpeg_engine import build_normalize_cmd, run_ffmpeg


def test_build_normalize_uses_array():
    cmd = build_normalize_cmd("/in.mp4", "/out.mp4", 1920, 1080, 30, "libx264")
    assert cmd[0] == "ffmpeg"
    assert "-i" in cmd
    assert ";" not in " ".join(cmd)


def test_run_ffmpeg_rejects_non_ffmpeg():
    with pytest.raises(ValueError):
        run_ffmpeg(["rm", "-rf", "/"])
