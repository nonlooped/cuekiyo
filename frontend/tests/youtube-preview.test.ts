import assert from "node:assert/strict";
import test from "node:test";
import { youtubeEmbedUrl } from "../src/lib/youtube-embed.ts";

test("youtubeEmbedUrl uses privacy-enhanced domain", () => {
	assert.equal(
		youtubeEmbedUrl("dQw4w9WgXcQ"),
		"https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
	);
});

test("youtubeEmbedUrl adds start parameter when provided", () => {
	assert.equal(
		youtubeEmbedUrl("dQw4w9WgXcQ", 30),
		"https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=30",
	);
});
