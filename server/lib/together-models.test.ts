import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPlausibleModelId } from "./together-models.ts";

describe("isPlausibleModelId", () => {
  it("accepts Together-style org/name ids", () => {
    assert.equal(isPlausibleModelId("meta-llama/Llama-3.3-70B-Instruct-Turbo"), true);
    assert.equal(isPlausibleModelId("Qwen/Qwen2.5-72B-Instruct-Turbo"), true);
  });

  it("rejects empty or malformed ids", () => {
    assert.equal(isPlausibleModelId(""), false);
    assert.equal(isPlausibleModelId("no-slash"), false);
    assert.equal(isPlausibleModelId("../evil"), false);
  });
});
