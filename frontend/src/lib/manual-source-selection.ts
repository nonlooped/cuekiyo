type ManualSourceSong = {
	id: string;
	selected_candidate_id?: string | null;
};

export function allManualSourcesSet(songs: ManualSourceSong[]): boolean {
	return songs.length > 0 && songs.every((song) => song.selected_candidate_id);
}
