import assert from "node:assert/strict";
import test from "node:test";
import {
	DEFAULT_OVERLAY_CONFIG,
	mergeOverlayConfig,
} from "../src/lib/overlay-config.ts";

test("mergeOverlayConfig fills missing keys", () => {
	const merged = mergeOverlayConfig({ enabled: false });
	assert.equal(merged.enabled, false);
	assert.equal(merged.style, DEFAULT_OVERLAY_CONFIG.style);
});
