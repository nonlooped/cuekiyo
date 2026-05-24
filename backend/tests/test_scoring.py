from app.services.youtube_sourcer import REJECT_KEYWORDS, score_candidate


def test_remix_penalty():
    entry = {
        "id": "abc",
        "title": "Anime OP1 Remix Nightcore Extended",
        "view_count": 1000000,
        "duration": 90,
        "webpage_url": "https://youtube.com/watch?v=abc",
    }
    result = score_candidate(entry, "Naruto", "Blue Bird", "Ikimonogakari", "opening", 1)
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
        1,
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
        1,
    )
    assert good.score > bad.score


def test_wrong_opening_number_scores_lower():
    correct = score_candidate(
        {
            "id": "1",
            "title": "One Piece Opening 1 | We Are! by Hiroshi Kitadani",
            "view_count": 5_000_000,
            "duration": 90,
        },
        "One Piece",
        "We Are!",
        "Hiroshi Kitadani",
        "opening",
        1,
    )
    wrong = score_candidate(
        {
            "id": "2",
            "title": "One Piece Opening 20 | Hope by Namie Amuro",
            "view_count": 44_000_000,
            "duration": 90,
        },
        "One Piece",
        "We Are!",
        "Hiroshi Kitadani",
        "opening",
        1,
    )
    assert correct.score > wrong.score


def test_lyrics_upload_is_not_rejected():
    result = score_candidate(
        {
            "id": "1",
            "title": "One Piece OP 1 - We Are! Lyrics",
            "view_count": 37_000_000,
            "duration": 90,
        },
        "One Piece",
        "We Are!",
        "Hiroshi Kitadani",
        "opening",
        1,
    )
    assert result.rejection_flags == []
    assert result.score > 60


def test_similar_song_title_scores_lower():
    correct = score_candidate(
        {
            "id": "1",
            "title": "Black Clover Opening 3 | Black Rover by Vickeblanka",
            "view_count": 5_000_000,
            "duration": 90,
        },
        "Black Clover",
        "Black Rover",
        "Vickeblanka",
        "opening",
        3,
    )
    wrong = score_candidate(
        {
            "id": "2",
            "title": "Black Clover Opening 10 | Black Catcher by Vickeblanka",
            "view_count": 44_000_000,
            "duration": 90,
        },
        "Black Clover",
        "Black Rover",
        "Vickeblanka",
        "opening",
        3,
    )
    assert correct.score > wrong.score


def test_creditless_and_embedded_words_are_not_reject_flags():
    result = score_candidate(
        {
            "id": "1",
            "title": "Attack on Titan Opening 1 Creditless Guren no Yumiya",
            "view_count": 40_000_000,
            "duration": 90,
        },
        "Attack on Titan",
        "Guren no Yumiya",
        "Linked Horizon",
        "opening",
        1,
    )

    assert "edit" not in result.rejection_flags

    alive = score_candidate(
        {
            "id": "2",
            "title": "Anime Song Alive Official Audio",
            "view_count": 1_000_000,
            "duration": 90,
        },
        "Anime",
        "Song",
        "Artist",
        "opening",
        1,
    )

    assert "live" not in alive.rejection_flags


def test_we_are_one_does_not_match_we_are_song_title():
    from app.services.youtube_sourcer import _is_relevant_result, score_candidate

    entry = {
        "id": "1",
        "title": "We Are One (Ole Ola) [The Official 2014 FIFA World Cup Song]",
        "uploader": "Pitbull",
        "channel_is_verified": True,
        "view_count": 1_000_000_000,
        "duration": 93,
    }
    result = score_candidate(entry, "One Piece", "We Are!", "Hiroshi Kitadani", "opening", 1)
    assert not _is_relevant_result(result, "One Piece", "We Are!", "Hiroshi Kitadani", "opening", 1)


def test_anime_opening_without_song_title_is_relevant():
    from app.services.youtube_sourcer import _is_relevant_result, score_candidate

    entry = {
        "id": "1",
        "title": "One Piece Opening 2",
        "view_count": 21_000_000,
        "duration": 90,
    }
    result = score_candidate(entry, "One Piece", "Believe", "Folder5", "opening", 2)
    assert _is_relevant_result(result, "One Piece", "Believe", "Folder5", "opening", 2)
    official = score_candidate(
        {
            "id": "1",
            "title": "Linked Horizon - Guren no Yumiya Official Audio",
            "uploader": "Linked Horizon - Topic",
            "channel_is_verified": True,
            "view_count": 50_000_000,
            "duration": 310,
        },
        "Attack on Titan",
        "Guren no Yumiya",
        "Linked Horizon",
        "opening",
        1,
    )
    cover = score_candidate(
        {
            "id": "2",
            "title": "Attack on Titan Opening 1 Guren no Yumiya Piano Cover",
            "uploader": "Piano Covers",
            "view_count": 100_000_000,
            "duration": 90,
        },
        "Attack on Titan",
        "Guren no Yumiya",
        "Linked Horizon",
        "opening",
        1,
    )

    assert official.score > cover.score
    assert "cover" in cover.rejection_flags
    assert "piano" in cover.rejection_flags
