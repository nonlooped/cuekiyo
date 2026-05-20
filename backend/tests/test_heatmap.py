from app.services.heatmap import highest_average_window


def test_short_video_uses_full_duration():
    start, end = highest_average_window([], 10.0, 8.0)
    assert start == 0.0
    assert end == 8.0


def test_window_picks_high_average_region():
    points = [(i, 1.0 if 30 <= i <= 40 else 0.1) for i in range(0, 100)]
    start, end = highest_average_window(points, 10.0, 100.0)
    assert 25 <= start <= 35
    assert end - start == 10.0


def test_fallback_when_no_heatmap():
    start, end = highest_average_window([], 10.0, 100.0)
    assert start == 45.0
    assert end == 55.0
