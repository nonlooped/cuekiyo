from app.schemas.song import CandidateOut


def test_candidate_out_parses_rejection_flags_json_string():
    out = CandidateOut.model_validate(
        {
            "id": "c1",
            "song_id": "song-1",
            "youtube_id": "abc123",
            "url": "https://youtube.com/watch?v=abc123",
            "title": "Test",
            "uploader_name": None,
            "view_count": 100,
            "duration": 90.0,
            "thumbnail_url": None,
            "score": 1.0,
            "rank": 1,
            "is_selected": False,
            "rejection_flags": '["remix", "cover"]',
        }
    )
    assert out.rejection_flags == ["remix", "cover"]


def test_candidate_out_empty_rejection_flags():
    out = CandidateOut.model_validate(
        {
            "id": "c1",
            "song_id": "song-1",
            "youtube_id": "abc123",
            "url": "https://youtube.com/watch?v=abc123",
            "title": "Test",
            "uploader_name": None,
            "view_count": None,
            "duration": None,
            "thumbnail_url": None,
            "score": 1.0,
            "rank": 1,
            "is_selected": False,
            "rejection_flags": "[]",
        }
    )
    assert out.rejection_flags == []
