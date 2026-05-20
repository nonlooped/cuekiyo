from app.services.youtube_sourcer import REJECT_KEYWORDS, score_candidate


def test_remix_penalty():
    entry = {
        "id": "abc",
        "title": "Anime OP1 Remix Nightcore Extended",
        "view_count": 1000000,
        "duration": 90,
        "webpage_url": "https://youtube.com/watch?v=abc",
    }
    result = score_candidate(entry, "Naruto", "Blue Bird", "Ikimonogakari", "opening")
    assert any(kw in result.rejection_flags for kw in REJECT_KEYWORDS[:3])
    assert result.score < 50


def test_good_title_scores_higher():
    good = score_candidate(
        {
            "id": "1",
            "title": "Naruto Opening 1 Blue Bird",
            "view_count": 5000000,
            "duration": 90,
        },
        "Naruto",
        "Blue Bird",
        "Ikimonogakari",
        "opening",
    )
    bad = score_candidate(
        {
            "id": "2",
            "title": "random vlog",
            "view_count": 100,
            "duration": 300,
        },
        "Naruto",
        "Blue Bird",
        None,
        "opening",
    )
    assert good.score > bad.score
