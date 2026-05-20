from pathlib import Path
from unittest.mock import patch

import pytest

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
