from sqlalchemy import inspect, text

from app.database import SessionLocal, engine, init_db, _ensure_sqlite_columns


def test_ensure_sqlite_columns_adds_project_source_mode(tmp_path, monkeypatch):
    db_path = tmp_path / "migrate.db"
    monkeypatch.setenv("PIPELINE_DB_PATH", str(db_path))
    from importlib import reload
    import app.config as config_mod
    import app.database as db_mod
    import app.models as models_mod

    reload(config_mod)
    reload(db_mod)
    reload(models_mod)
    db_mod.init_db()

    inspector = inspect(db_mod.engine)
    columns = {col["name"] for col in inspector.get_columns("projects")}
    assert "source_mode" in columns
    assert "overlay_config_json" in columns
