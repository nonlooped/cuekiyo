from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.services import jikan_client


@pytest.mark.asyncio
async def test_jikan_429_retry_capped():
    responses = [httpx.Response(429, request=httpx.Request("GET", "http://test")) for _ in range(6)]
    client = AsyncMock()
    client.get = AsyncMock(side_effect=responses)

    with patch.object(jikan_client, "_MAX_429_RETRIES", 5):
        with pytest.raises(httpx.HTTPStatusError):
            await jikan_client._get(client, "/anime/1")


@pytest.mark.asyncio
async def test_theme_upsert_is_idempotent(db_session):
    from app.jobs.runner import JobRunner
    from app.models import Job, Project, ProjectAnime, ThemeSong
    from app.services.theme_parser import ParsedTheme
    from app.enums import SongType

    project = Project(title="Test", status="LOADING_THEMES", song_types='["opening"]')
    db_session.add(project)
    db_session.flush()
    db_session.add(ProjectAnime(project_id=project.id, anime_mal_id=1, anime_name="Anime", display_order=0))
    db_session.commit()
    job = Job(project_id=project.id, type="load_themes", status="running")
    db_session.add(job)
    db_session.commit()

    runner = JobRunner()
    parsed = ParsedTheme(
        song_type=SongType.OPENING,
        song_number=1,
        song_title="Title",
        artist="Artist",
        raw_text="1: Title by Artist",
    )
    runner._upsert_theme(db_session, 1, parsed)
    runner._upsert_theme(db_session, 1, parsed)
    db_session.commit()

    themes = db_session.query(ThemeSong).filter(ThemeSong.anime_mal_id == 1).all()
    assert len(themes) == 1
