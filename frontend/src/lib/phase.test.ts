import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveDigestPhase } from "./phase.ts";

describe("deriveDigestPhase", () => {
  it("returns empty when nothing has started", () => {
    assert.equal(
      deriveDigestPhase({
        running: false,
        hasCards: false,
        hasResult: false,
        hasError: false,
        configLoaded: true,
      }),
      "empty"
    );
  });

  it("returns running while a digest is in flight", () => {
    assert.equal(
      deriveDigestPhase({
        running: true,
        hasCards: true,
        hasResult: false,
        hasError: false,
        configLoaded: true,
      }),
      "running"
    );
  });

  it("returns complete when a result exists", () => {
    assert.equal(
      deriveDigestPhase({
        running: false,
        hasCards: true,
        hasResult: true,
        hasError: false,
        configLoaded: true,
      }),
      "complete"
    );
  });

  it("returns partial when cards exist after an error", () => {
    assert.equal(
      deriveDigestPhase({
        running: false,
        hasCards: true,
        hasResult: false,
        hasError: true,
        configLoaded: true,
      }),
      "partial"
    );
  });

  it("returns error for config or full-run failure", () => {
    assert.equal(
      deriveDigestPhase({
        running: false,
        hasCards: false,
        hasResult: false,
        hasError: true,
        configLoaded: false,
      }),
      "error"
    );
    assert.equal(
      deriveDigestPhase({
        running: false,
        hasCards: false,
        hasResult: false,
        hasError: true,
        configLoaded: true,
      }),
      "error"
    );
  });
});
