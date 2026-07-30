import { task } from "@renderinc/sdk/workflows";
import { z } from "zod";
import type { DigestSummary, ItemAnalysis } from "../../shared/types.js";
import { chatJson } from "../lib/together.js";

const summarySchema = z.object({
  headline: z.string(),
  doToday: z.array(z.string()).max(5),
  readNow: z.array(z.string()).max(5),
  skip: z.array(z.string()).max(5),
});

const SYSTEM = `You write the top of a reading digest for someone catching up fast.
Return JSON only: headline, doToday, readNow, skip (each array max 5 strings).

Rules:
- headline: one concrete next priority. Prefer a verb. Not a cute summary.
- doToday / readNow / skip: short actionable lines. Start with verbs when possible. Prefer fewer items over fluff. Empty arrays are fine.
- Reference item titles only when they help the reader act.
- No preamble, no recap, no hype.`;

/** Synthesize the overall digest summary from per-item analyses. */
export const synthesizeDigest = task(
  {
    name: "synthesize_digest",
    plan: "starter",
    timeoutSeconds: 120,
    retry: { maxRetries: 2, waitDurationMs: 3000, backoffScaling: 2 },
  },
  async function synthesizeDigest(
    items: ItemAnalysis[],
    model: string
  ): Promise<DigestSummary> {
    const user = `Items:\n${JSON.stringify(items, null, 2)}

Write headline + doToday + readNow + skip. Cap each list at 5. Lead with what to do.`;

    const parsed = await chatJson(SYSTEM, user, summarySchema, model);
    return {
      headline: parsed.headline,
      doToday: parsed.doToday.slice(0, 5),
      readNow: parsed.readNow.slice(0, 5),
      skip: parsed.skip.slice(0, 5),
    };
  }
);
