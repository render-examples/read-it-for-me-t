import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { spanPosition } from "./format.ts";

describe("spanPosition", () => {
  it("places earlier spans further left (left-to-right time)", () => {
    const timeline = { startMs: 1_000, durationMs: 10_000 };
    const earlier = spanPosition(
      {
        key: "a",
        stage: "fetch",
        label: "Fetch",
        attempt: 1,
        startMs: 1_000,
        endMs: 3_000,
        status: "complete",
        latencyMs: 2_000,
      },
      timeline
    );
    const later = spanPosition(
      {
        key: "b",
        stage: "analyze",
        label: "Analyze",
        attempt: 1,
        startMs: 5_000,
        endMs: 8_000,
        status: "complete",
        latencyMs: 3_000,
      },
      timeline
    );

    assert.equal(earlier.left, 0);
    assert.equal(later.left, 40);
    assert.ok(earlier.left < later.left);
  });
});
