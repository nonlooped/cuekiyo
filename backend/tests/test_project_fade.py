from pathlib import Path
from unittest.mock import MagicMock, patch

from app.enums import JobStatus, JobType, ProjectStatus
from app.models import Job, Project, Song


def test_create_project_with_fade_seconds(client):
    res = client.post(
        "/api/projects",
        json={
            "title": "Fade MV",
            "animes": [{"anime_mal_id": 1, "anime_name": "Test", "display_order": 0}],
            "fade_seconds": 1.25,
        },
    )
    assert res.status_code == 201
    assert res.json()["fade_seconds"] == 1.25


def test_update_project_fade_seconds(client, db_session):
    project = Project(title="Fade", fade_seconds=0.5)
    db_session.add(project)
    db_session.commit()

    res = client.patch(f"/api/projects/{project.id}", json={"fade_seconds": 2.0})
    assert res.status_code == 200
    assert res.json()["fade_seconds"] == 2.0


def test_render_uses_project_fade_seconds(db_session, tmp_path, monkeypatch):
    from app.jobs.runner import JobRunner

    overlay = tmp_path / "clip.mp4"
    overlay.write_bytes(b"clip")
    project = Project(
        title="T",
        fade_seconds=1.25,
        encoder="libx264",
        status=ProjectStatus.RENDERING.value,
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
        )
    )
    job = Job(
        project_id=project.id,
        type=JobType.RENDER.value,
        status=JobStatus.RUNNING.value,
    )
    db_session.add(job)
    db_session.commit()

    captured: dict[str, float] = {}

    def fake_build(clips, out, fade_seconds, enc):
        captured["fade"] = fade_seconds
        return ["ffmpeg", "-y"]

    def fake_parallel(_self, _db, _job, _project, items, *, max_workers, worker, on_complete):
        for task in items:
            on_complete(task, worker(task))

    monkeypatch.setattr("app.jobs.runner.ffmpeg_engine.build_concat_render_cmd", fake_build)
    monkeypatch.setattr(
        "app.jobs.runner.ffmpeg_engine.ensure_audio_clip",
        lambda clip, _audio_dir: clip,
    )
    monkeypatch.setattr("app.jobs.runner.ffmpeg_engine.run_ffmpeg", lambda *a, **k: None)
    monkeypatch.setattr("app.jobs.runner.ffmpeg_engine.is_valid_media", lambda _p: True)
    monkeypatch.setattr(JobRunner, "_run_parallel_stage", fake_parallel)

    runner = JobRunner()
    runner._run_render(db_session, job, project)

    assert captured.get("fade") == 1.25
