from app.jobs.runner import _overall_progress
from app.enums import ProjectStatus


def test_overall_progress_spans_pipeline():
    assert _overall_progress(ProjectStatus.LOADING_THEMES, 0) == 0
    assert _overall_progress(ProjectStatus.SOURCING, 0) > _overall_progress(ProjectStatus.LOADING_THEMES, 0)
    assert _overall_progress(ProjectStatus.RENDERING, 100) == 99.0


def test_overall_progress_increments_within_stage():
    early = _overall_progress(ProjectStatus.DOWNLOADING, 0)
    mid = _overall_progress(ProjectStatus.DOWNLOADING, 50)
    late = _overall_progress(ProjectStatus.DOWNLOADING, 100)
    assert early < mid < late
