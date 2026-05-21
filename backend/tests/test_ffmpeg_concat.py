from pathlib import Path
from unittest.mock import patch

import pytest

from app.services.ffmpeg_engine import build_concat_render_cmd, build_render_cmd, ensure_audio_clip, has_audio_stream


def test_build_concat_rejects_video_only(tmp_path):
    clip = tmp_path / "video_only.mp4"
    clip.write_bytes(b"fake")

    with patch("app.services.ffmpeg_engine.has_audio_stream", return_value=False):
        with pytest.raises(RuntimeError, match="missing audio"):
            build_concat_render_cmd([clip], tmp_path / "out.mp4", 0.5, "libx264")


def test_ensure_audio_clip_adds_silent_track(tmp_path):
    clip = tmp_path / "clip.mp4"
    out = tmp_path / "with_audio.mp4"
    clip.write_bytes(b"x")
    out.write_bytes(b"y")

    with patch("app.services.ffmpeg_engine.has_audio_stream", side_effect=[False, True]):
        with patch("app.services.ffmpeg_engine.run_ffmpeg") as run:
            result = ensure_audio_clip(clip, tmp_path)
            run.assert_called_once()
            assert result == tmp_path / "clip_with_audio.mp4"
