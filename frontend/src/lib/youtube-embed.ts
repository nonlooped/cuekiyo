import { parseYoutubeId } from "./youtube-url.ts";

export function youtubeEmbedUrl(
	youtubeId: string,
	startSeconds = 0,
): string {
	const id = parseYoutubeId(youtubeId) ?? youtubeId;
	const start = startSeconds > 0 ? `?start=${Math.floor(startSeconds)}` : "";
	return `https://www.youtube-nocookie.com/embed/${id}${start}`;
}
