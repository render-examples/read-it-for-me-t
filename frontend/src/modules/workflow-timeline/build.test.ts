import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildWorkflowTimeline } from "./build.ts";
import type { StageEvent } from "./types.ts";

const t0 = Date.parse("2026-07-29T12:00:00.000Z");

function event(
  partial: Omit<StageEvent, "id" | "at"> & { id: number; atOffsetMs: number }
): StageEvent {
  return {
    id: partial.id,
    rowId: partial.rowId,
    rowLabel: partial.rowLabel,
    stage: partial.stage,
    status: partial.status,
    at: new Date(t0 + partial.atOffsetMs).toISOString(),
    attempt: partial.attempt,
    latencyMs: partial.latencyMs,
    message: partial.message,
  };
}

describe("buildWorkflowTimeline", () => {
  it("builds fetch → analyze spans per item and a synthesize row", () => {
    const events: StageEvent[] = [
      event({
        id: 1,
        rowId: "item-0",
        rowLabel: "together.ai",
        stage: "fetch",
        status: "started",
        atOffsetMs: 0,
      }),
      event({
        id: 2,
        rowId: "item-0",
        rowLabel: "together.ai",
        stage: "fetch",
        status: "completed",
        atOffsetMs: 2000,
        latencyMs: 2000,
      }),
      event({
        id: 3,
        rowId: "item-0",
        rowLabel: "together.ai",
        stage: "analyze",
        status: "started",
        atOffsetMs: 2100,
      }),
      event({
        id: 4,
        rowId: "item-0",
        rowLabel: "together.ai",
        stage: "analyze",
        status: "completed",
        atOffsetMs: 5000,
        latencyMs: 2900,
      }),
      event({
        id: 5,
        rowId: "digest",
        rowLabel: "Digest",
        stage: "synthesize",
        status: "started",
        atOffsetMs: 5100,
      }),
      event({
        id: 6,
        rowId: "digest",
        rowLabel: "Digest",
        stage: "synthesize",
        status: "completed",
        atOffsetMs: 7000,
        latencyMs: 1900,
      }),
    ];

    const timeline = buildWorkflowTimeline({
      events,
      nowMs: t0 + 7000,
      active: false,
    });

    assert.equal(timeline.rows.length, 2);
    assert.equal(timeline.rows[0]?.rowId, "item-0");
    assert.equal(timeline.rows[0]?.spans.length, 2);
    assert.equal(timeline.rows[0]?.spans[0]?.stage, "fetch");
    assert.equal(timeline.rows[0]?.spans[0]?.status, "complete");
    assert.equal(timeline.rows[0]?.spans[1]?.stage, "analyze");
    assert.equal(timeline.rows[1]?.rowId, "digest");
    assert.equal(timeline.rows[1]?.spans[0]?.stage, "synthesize");
    assert.equal(timeline.rows[1]?.status, "complete");
  });

  it("extends open spans as running while active", () => {
    const events: StageEvent[] = [
      event({
        id: 1,
        rowId: "item-0",
        rowLabel: "together.ai",
        stage: "analyze",
        status: "started",
        atOffsetMs: 0,
      }),
    ];

    const timeline = buildWorkflowTimeline({
      events,
      nowMs: t0 + 3000,
      active: true,
    });

    assert.equal(timeline.rows[0]?.status, "running");
    assert.equal(timeline.rows[0]?.spans[0]?.status, "running");
    assert.equal(timeline.rows[0]?.spans[0]?.latencyMs, 3000);
  });

  it("marks failed stages and surfaces the message", () => {
    const events: StageEvent[] = [
      event({
        id: 1,
        rowId: "item-0",
        rowLabel: "together.ai",
        stage: "fetch",
        status: "started",
        atOffsetMs: 0,
      }),
      event({
        id: 2,
        rowId: "item-0",
        rowLabel: "together.ai",
        stage: "fetch",
        status: "failed",
        atOffsetMs: 1500,
        message: "timeout",
      }),
    ];

    const timeline = buildWorkflowTimeline({
      events,
      nowMs: t0 + 1500,
      active: false,
    });

    assert.equal(timeline.rows[0]?.status, "failed");
    assert.equal(timeline.rows[0]?.failureReason, "timeout");
    assert.equal(timeline.rows[0]?.spans[0]?.status, "failed");
  });
});
