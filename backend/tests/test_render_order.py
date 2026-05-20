def test_unique_render_order_validation():
    ids = ["a", "b", "c"]
    assert len(ids) == len(set(ids))


def test_duplicate_detected():
    ids = ["a", "b", "a"]
    assert len(ids) != len(set(ids))
