from typing import Literal

from pydantic import BaseModel


class AppSettingsOut(BaseModel):
    anime_metadata_provider: Literal["jikan", "anilist"]


class AppSettingsUpdate(BaseModel):
    anime_metadata_provider: Literal["jikan", "anilist"]
