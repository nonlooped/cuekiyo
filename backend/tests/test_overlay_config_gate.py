from app.enums import ProjectStatus
from app.state_machine import can_transition, next_auto_status_after_user_gate


def test_cutting_advances_to_overlay_config_gate():
    assert can_transition(ProjectStatus.CUTTING, ProjectStatus.AWAITING_OVERLAY_CONFIG)
    assert can_transition(ProjectStatus.AWAITING_OVERLAY_CONFIG, ProjectStatus.OVERLAYING)
    assert next_auto_status_after_user_gate(ProjectStatus.AWAITING_OVERLAY_CONFIG) == ProjectStatus.OVERLAYING


def test_cutting_no_longer_skips_overlay_gate():
    assert not can_transition(ProjectStatus.CUTTING, ProjectStatus.OVERLAYING)
