import pytest
from fastapi import HTTPException

from app.enums import ProjectStatus
from app.models import Project, Song


def _project_with_songs(db_session, count: int = 4) -> tuple[str, list[str]]:
    project = Project(
        title="Reorder",
        status=ProjectStatus.AWAITING_RENDER_ORDER.value,
        songs_count=count,
        song_types='["opening"]',
    )
    db_session.add(project)
    db_session.flush()
    song_ids: list[str] = []
    for i in range(count):
        song = Song(
            project_id=project.id,
            anime_mal_id=1,
            anime_name="Anime",
            song_type="opening",
            song_number=1,
            song_title=f"Song {i}",
            raw_theme_text="OP1",
            render_order=i,
        )
        db_session.add(song)
        db_session.flush()
        song_ids.append(song.id)
    db_session.commit()
    return project.id, song_ids


def test_update_render_order_reverses_without_unique_violation(db_session):
    from app.api.routes import update_render_order
    from app.schemas.project import RenderOrderUpdate

    project_id, song_ids = _project_with_songs(db_session)
    reversed_ids = list(reversed(song_ids))

    update_render_order(project_id, RenderOrderUpdate(song_ids=reversed_ids), db_session)

    songs = (
        db_session.query(Song)
        .filter(Song.project_id == project_id)
        .order_by(Song.render_order)
        .all()
    )
    assert [s.id for s in songs] == reversed_ids
    assert [s.render_order for s in songs] == list(range(len(song_ids)))


def test_update_render_order_rejects_duplicate_song_ids(db_session):
    from app.api.routes import update_render_order
    from app.schemas.project import RenderOrderUpdate

    project_id, song_ids = _project_with_songs(db_session, count=2)
    with_duplicates = [song_ids[0], song_ids[0]]

    with pytest.raises(HTTPException) as exc:
        update_render_order(project_id, RenderOrderUpdate(song_ids=with_duplicates), db_session)

    assert exc.value.status_code == 400
    assert "duplicate" in str(exc.value.detail).lower()
