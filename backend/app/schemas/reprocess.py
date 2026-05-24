from typing import Literal

from pydantic import BaseModel


class ReprocessRequest(BaseModel):
    stage: Literal["overlay", "render"]
