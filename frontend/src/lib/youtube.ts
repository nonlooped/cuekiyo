import type { Candidate } from "../types";

export function candidateThumbnail(candidate: Candidate): string | null {
	if (candidate.thumbnail_url) return candidate.thumbnail_url;
	if (candidate.youtube_id) {
		return `https://i.ytimg.com/vi/${candidate.youtube_id}/mqdefault.jpg`;
	}
	return null;
}
