import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COPY } from "./copy.ts";
import { splitComposerInput, validateComposerInput } from "./composer.ts";

describe("validateComposerInput", () => {
  it("rejects empty input with no PDFs", () => {
    assert.equal(validateComposerInput("   ", 0), COPY.composer.emptyError);
  });

  it("accepts text without PDFs", () => {
    assert.equal(validateComposerInput("https://render.com", 0), null);
  });

  it("accepts PDFs without text", () => {
    assert.equal(validateComposerInput("", 1), null);
  });
});

describe("splitComposerInput", () => {
  it("separates URLs from notes", () => {
    const result = splitComposerInput(
      "https://render.com/docs\nship notes\nhttps://www.together.ai/"
    );
    assert.equal(result.urls, "https://render.com/docs\nhttps://www.together.ai/");
    assert.equal(result.text, "ship notes");
  });
});
