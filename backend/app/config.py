import json
from pathlib import Path

from pydantic import BaseModel

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_DEFAULT_DATA_DIR = _REPO_ROOT / "data"


class Settings(BaseModel):
    data_dir: Path = _DEFAULT_DATA_DIR
    db_path: Path | None = None
    jikan_base_url: str = "https://api.jikan.moe/v4"
    jikan_rate_limit_seconds: float = 0.35
    transition_seconds: float = 0.5
    fade_seconds: float = 0.5
    ffmpeg_crf: int = 18
    ffmpeg_cq: int = 19
    candidate_count: int = 3
    youtube_workers: int = 2
    ffmpeg_workers: int = 0
    ws_heartbeat_seconds: int = 30
    stale_lock_seconds: int = 120

    @property
    def database_url(self) -> str:
        path = (self.db_path or (self.data_dir / "pipeline.db")).resolve()
        path.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{path.as_posix()}"

    @property
    def projects_dir(self) -> Path:
        d = self.data_dir / "projects"
        d.mkdir(parents=True, exist_ok=True)
        return d


def settings_file(data_dir: Path | None = None) -> Path:
    return (data_dir or _DEFAULT_DATA_DIR) / "settings.json"


def load_settings() -> Settings:
    for candidate_dir in (_DEFAULT_DATA_DIR,):
        path = settings_file(candidate_dir)
        if not path.exists():
            continue
        raw = json.loads(path.read_text(encoding="utf-8"))
        if "data_dir" in raw:
            raw["data_dir"] = Path(raw["data_dir"])
        if raw.get("db_path"):
            raw["db_path"] = Path(raw["db_path"])
        loaded = Settings.model_validate(raw)
        if loaded.data_dir != candidate_dir:
            save_settings(loaded)
        return loaded
    return Settings(data_dir=_DEFAULT_DATA_DIR)


def save_settings(current: Settings) -> None:
    current.data_dir.mkdir(parents=True, exist_ok=True)
    path = settings_file(current.data_dir)
    payload = current.model_dump(mode="json")
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def apply_settings(update: dict) -> None:
    data = settings.model_dump()
    data.update(update)
    if "data_dir" in data and isinstance(data["data_dir"], str):
        data["data_dir"] = Path(data["data_dir"])
    if data.get("db_path") and isinstance(data["db_path"], str):
        data["db_path"] = Path(data["db_path"])
    updated = Settings.model_validate(data)
    for field in Settings.model_fields:
        setattr(settings, field, getattr(updated, field))
    save_settings(settings)


settings = load_settings()
