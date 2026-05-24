from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.enums import JobType, ProjectStatus, SongStatus
from app.models import Project, Song


@pytest.fixture()
def completed_project_with_clips(db_session, tmp_path):
    clean = tmp_path / "clean.mp4"
    clean.write_bytes(b"clean")
    overlay = tmp_path / "overlay.mp4"
    overlay.write_bytes(b"overlay")
    project = Project(
        title="Done",
        status=ProjectStatus.COMPLETED.value,
        songs_count=1,
        song_types='["opening"]',
        output_path=str(tmp_path / "output.mp4"),
    )
    db_session.add(project)
    db_session.flush()
    db_session.add(
        Song(
            project_id=project.id,
            anime_mal_id=1,
            anime_name="Anime",
            song_type="opening",
            song_number=1,
            song_title="Song",
            raw_theme_text="OP1",
            render_order=0,
            clean_clip_path=str(clean),
            overlayed_clip_path=str(overlay),
            status=SongStatus.READY.value,
        )
    )
    db_session.commit()
    db_session.refresh(project)
    return project


@pytest.fixture()
def completed_project_with_overlay(db_session, tmp_path):
    overlay = tmp_path / "overlay.mp4"
    overlay.write_bytes(b"overlay")
    project = Project(
        title="Done",
        status=ProjectStatus.COMPLETED.value,
        songs_count=1,
        song_types='["opening"]',
        output_path=str(tmp_path / "output.mp4"),
    )
    db_session.add(project)
    db_session.flush()
    db_session.add(
        Song(
            project_id=project.id,
            anime_mal_id=1,
            anime_name="Anime",
            song_type="opening",
            song_number=1,
            song_title="Song",
            raw_theme_text="OP1",
            render_order=0,
            overlayed_clip_path=str(overlay),
            status=SongStatus.READY.value,
        )
    )
    db_session.commit()
    db_session.refresh(project)
    return project


def test_reprocess_overlay_clears_overlay_artifacts_and_starts_overlay_job(
    db_session, completed_project_with_clips, client
):
    project = completed_project_with_clips
    song = project.songs[0]
    assert song.overlayed_clip_path is not None

    with patch("app.api.routes.job_runner.start_job", return_value=MagicMock(id="job-overlay")) as start_job:
        res = client.post(f"/api/projects/{project.id}/reprocess", json={"stage": "overlay"})

    assert res.status_code == 200
    db_session.refresh(project)
    db_session.refresh(song)
    assert project.status == ProjectStatus.OVERLAYING.value
    assert res.json()["jobId"] == "job-overlay"
    assert song.overlayed_clip_path is None
    assert song.status == SongStatus.CUTTING.value
    start_job.assert_called_once_with(project.id, JobType.OVERLAY)


def test_reprocess_render_same_as_render_again(db_session, completed_project_with_overlay, client):
    project = completed_project_with_overlay

    with patch("app.api.routes.job_runner.start_job", return_value=MagicMock(id="job-render")) as start_job:
        res = client.post(f"/api/projects/{project.id}/reprocess", json={"stage": "render"})

    assert res.status_code == 200
    assert res.json()["jobId"] == "job-render"
    db_session.refresh(project)
    assert project.status == ProjectStatus.RENDERING.value
    start_job.assert_called_once_with(project.id, JobType.RENDER)
