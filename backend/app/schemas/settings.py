from pydantic import BaseModel, Field


class SettingsOut(BaseModel):
    data_dir: str
    jikan_rate_limit_seconds: float
    candidate_count: int = Field(ge=1, le=20)
    youtube_workers: int = Field(ge=1, le=16)
    ffmpeg_workers: int = Field(ge=0, le=16)
    ffmpeg_crf: int = Field(ge=0, le=51)
    ffmpeg_cq: int = Field(ge=0, le=51)
    stale_lock_seconds: int = Field(ge=30, le=3600)


class SettingsUpdate(BaseModel):
    data_dir: str | None = None
    jikan_rate_limit_seconds: float | None = Field(default=None, ge=0.1, le=10)
    candidate_count: int | None = Field(default=None, ge=1, le=20)
    youtube_workers: int | None = Field(default=None, ge=1, le=16)
    ffmpeg_workers: int | None = Field(default=None, ge=0, le=16)
    ffmpeg_crf: int | None = Field(default=None, ge=0, le=51)
    ffmpeg_cq: int | None = Field(default=None, ge=0, le=51)
    stale_lock_seconds: int | None = Field(default=None, ge=30, le=3600)
