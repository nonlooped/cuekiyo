import asyncio
import json
import threading
import time
from typing import Any

import httpx

from app.config import settings

_last_request = 0.0
_lock = threading.Lock()

SEARCH_QUERY = """
query ($search: String!, $perPage: Int) {
  Page(perPage: $perPage) {
    media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
      idMal
      title { romaji english native }
      coverImage { large medium }
      seasonYear
      startDate { year }
    }
  }
}
"""

GET_BY_MAL_QUERY = """
query ($idMal: Int) {
  Media(idMal: $idMal, type: ANIME) {
    idMal
    title { romaji english native }
    coverImage { large medium }
    seasonYear
    startDate { year }
  }
}
"""


async def _rate_limit() -> None:
    global _last_request
    with _lock:
        now = time.monotonic()
        wait = settings.anilist_rate_limit_seconds - (now - _last_request)
        if wait > 0:
            _last_request = time.monotonic() + wait
        else:
            _last_request = time.monotonic()
    if wait > 0:
        await asyncio.sleep(wait)


async def _graphql(
    client: httpx.AsyncClient, query: str, variables: dict[str, Any]
) -> dict[str, Any]:
    await _rate_limit()
    resp = await client.post(
        settings.anilist_graphql_url,
        json={"query": query, "variables": variables},
    )
    resp.raise_for_status()
    payload = resp.json()
    if payload.get("errors"):
        messages = "; ".join(
            err.get("message", str(err)) for err in payload["errors"]
        )
        raise httpx.HTTPError(f"AniList GraphQL error: {messages}")
    return payload.get("data") or {}


def _normalize_media(media: dict[str, Any]) -> dict[str, Any]:
    title = media.get("title") or {}
    cover = media.get("coverImage") or {}
    start_date = media.get("startDate") or {}
    year = media.get("seasonYear") or start_date.get("year")
    return {
        "mal_id": media.get("idMal"),
        "title": title.get("romaji") or title.get("english") or title.get("native") or "",
        "title_english": title.get("english"),
        "image_url": cover.get("large") or cover.get("medium"),
        "year": year,
        "source": "anilist",
        "raw_json": json.dumps(media),
    }


_TIMEOUT = httpx.Timeout(connect=10.0, read=30.0, write=10.0, pool=10.0)


async def search_anime(query: str, limit: int = 10) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        data = await _graphql(client, SEARCH_QUERY, {"search": query, "perPage": limit})
    results: list[dict[str, Any]] = []
    for media in data.get("Page", {}).get("media") or []:
        if not media.get("idMal"):
            continue
        results.append(_normalize_media(media))
    return results


async def get_anime(mal_id: int) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        data = await _graphql(client, GET_BY_MAL_QUERY, {"idMal": mal_id})
    media = data.get("Media")
    if not media or not media.get("idMal"):
        raise httpx.HTTPError(f"AniList: no anime found for MAL id {mal_id}")
    return _normalize_media(media)