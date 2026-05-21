import pytest

from app.services.ffmpeg_engine import (
    _NVENC_PROBE_SIZE,
    _strip_hw_decode,
    build_normalize_cmd,
    run_ffmpeg,
)


def test_build_normalize_uses_array():
    cmd = build_normalize_cmd("/in.mp4", "/out.mp4", 1920, 1080, 24, "libx264")
    assert cmd[0] == "ffmpeg"
    assert "-i" in cmd
    assert ";" not in " ".join(cmd)
    assert "-crf" in cmd


def test_build_normalize_adds_cuda_decode_for_nvenc(monkeypatch):
    monkeypatch.setattr(
        "app.services.ffmpeg_engine.input_video_codec",
        lambda _path: "av1",
    )
    monkeypatch.setattr(
        "app.services.ffmpeg_engine.cuvid_decoder_for",
        lambda codec: "av1_cuvid" if codec == "av1" else None,
    )
    cmd = build_normalize_cmd("/in.mp4", "/out.mp4", 1920, 1080, 24, "h264_nvenc")
    assert cmd[:6] == ["ffmpeg", "-y", "-hwaccel", "cuda", "-c:v", "av1_cuvid"]
    assert cmd[6:8] == ["-i", "/in.mp4"]
    assert "-cq" in cmd


def test_nvenc_probe_uses_encoder_minimum_size(monkeypatch):
    captured: list[list[str]] = []

    def fake_run(cmd, **kwargs):
        captured.append(cmd)
        return type("Proc", (), {"returncode": 0, "stdout": "", "stderr": ""})()

    monkeypatch.setattr("app.services.ffmpeg_engine._encoder_listed", lambda _enc: True)
    monkeypatch.setattr("app.services.ffmpeg_engine._NVENC_PROBE_CACHE", {})
    monkeypatch.setattr("app.services.ffmpeg_engine.subprocess.run", fake_run)

    from app.services import ffmpeg_engine

    assert ffmpeg_engine._nvenc_usable("h264_nvenc") is True
    assert f"color=c=black:s={_NVENC_PROBE_SIZE}:d=0.1" in captured[0]


def test_strip_hw_decode_removes_input_decoder_only():
    cmd = [
        "ffmpeg",
        "-y",
        "-hwaccel",
        "cuda",
        "-c:v",
        "av1_cuvid",
        "-i",
        "/in.mp4",
        "-c:v",
        "h264_nvenc",
        "/out.mp4",
    ]
    assert _strip_hw_decode(cmd) == [
        "ffmpeg",
        "-y",
        "-i",
        "/in.mp4",
        "-c:v",
        "h264_nvenc",
        "/out.mp4",
    ]


def test_run_ffmpeg_rejects_non_ffmpeg():
    with pytest.raises(ValueError):
        run_ffmpeg(["rm", "-rf", "/"])
