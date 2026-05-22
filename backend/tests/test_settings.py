from app.config import Settings, apply_settings, load_settings, settings


def test_save_and_apply_settings(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "data_dir", tmp_path)
    apply_settings({"candidate_count": 5, "youtube_workers": 4})
    assert settings.candidate_count == 5
    assert settings.youtube_workers == 4
    path = tmp_path / "settings.json"
    assert path.exists()
    reloaded = Settings.model_validate_json(path.read_text(encoding="utf-8"))
    assert reloaded.candidate_count == 5
