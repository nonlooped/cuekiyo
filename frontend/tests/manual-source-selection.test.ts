import assert from "node:assert/strict";
import test from "node:test";
import { allManualSourcesSet } from "../src/lib/manual-source-selection.ts";

test("allManualSourcesSet requires every song", () => {
	assert.equal(
		allManualSourcesSet([
			{ id: "a", selected_candidate_id: "c1" },
			{ id: "b", selected_candidate_id: null },
		]),
		false,
	);
});

test("allManualSourcesSet is true when every song has a source", () => {
	assert.equal(
		allManualSourcesSet([
			{ id: "a", selected_candidate_id: "c1" },
			{ id: "b", selected_candidate_id: "c2" },
		]),
		true,
	);
});

test("allManualSourcesSet is false for an empty song list", () => {
	assert.equal(allManualSourcesSet([]), false);
});
