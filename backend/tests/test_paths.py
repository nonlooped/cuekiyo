import pytest

from app.services.paths import resolve_project_path, sanitize_filename


def test_sanitize_removes_unsafe():
    assert "/" not in sanitize_filename('foo/bar<baz>')
    assert ".." not in sanitize_filename("..evil")


def test_path_traversal_blocked():
    pid = "test-project-uuid"
    with pytest.raises(ValueError):
        resolve_project_path(pid, "..", "etc", "passwd")
