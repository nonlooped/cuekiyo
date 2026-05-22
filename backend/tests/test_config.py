import pytest

from app import config


def test_env_overrides_defaults(monkeypatch, tmp_path):
    monkeypatch.setenv("PIPELINE_DATA_DIR", str(tmp_path / "custom-data"))
    monkeypatch.setenv("PIPELINE_CANDIDATE_COUNT", "5")
    monkeypatch.setenv("PIPELINE_JIKAN_RATE_LIMIT_SECONDS", "0.5")

    loaded = config.load_settings()

    assert loaded.data_dir == tmp_path / "custom-data"
    assert loaded.candidate_count == 5
    assert loaded.jikan_rate_limit_seconds == pytest.approx(0.5)


def test_env_takes_precedence_over_legacy_json(monkeypatch, tmp_path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    settings_path = data_dir / "settings.json"
    settings_path.write_text(
        f'{{"data_dir": "{data_dir.as_posix()}", "candidate_count": 2}}',
        encoding="utf-8",
    )
    monkeypatch.setattr(config, "_DEFAULT_DATA_DIR", data_dir)
    monkeypatch.setenv("PIPELINE_CANDIDATE_COUNT", "7")

    loaded = config.load_settings()

    assert loaded.candidate_count == 7
