import { task } from "@renderinc/sdk/workflows";
import type { DigestItemInput } from "../../shared/types.js";
import { excerpt } from "../lib/together.js";

const FETCH_TIMEOUT_MS = 60_000;

/**
 * Workflow task: load one digest source.
 * URL → HTML strip; text → passthrough; PDF → MVP placeholder (no extraction yet).
 * Throws on HTTP errors so Render retries the run.
 */
export const fetchItem = task(
  {
    name: "fetch_item",
    plan: "starter",
    timeoutSeconds: 120,
    retry: { maxRetries: 2, waitDurationMs: 3000, backoffScaling: 2 },
  },
  async function fetchItem(item: DigestItemInput): Promise<{
    title: string;
    text: string;
    sourceLabel: string;
  }> {
    if (item.kind === "text") {
      return {
        title: "Pasted text",
        sourceLabel: "Pasted content",
        text: excerpt(item.value),
      };
    }

    if (item.kind === "pdf") {
      return {
        title: item.filename,
        sourceLabel: item.filename,
        text: `[PDF upload: ${item.filename}. Text extraction is not wired in this MVP — treat filename as context only.]`,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(item.value, {
      signal: controller.signal,
      headers: { "User-Agent": "ReadItForMe/1.0 (+https://read-it-for-me.onrender.com/)" },
    });
    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: HTTP ${response.status}`);
    }

    const html = await response.text();
    const title = extractTitle(html) || new URL(item.value).hostname;
    const text = stripHtml(html);

    return {
      title,
      sourceLabel: item.value,
      text: excerpt(text),
    };
  }
);

/** Pull <title> from HTML when present. */
function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() ?? null;
}

/** Naive HTML → text for LLM context (scripts/styles removed). */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
