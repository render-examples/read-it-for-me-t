import { task } from "@renderinc/sdk/workflows";
import { z } from "zod";
import type { ItemAnalysis } from "../../shared/types.js";
import { chatJson, excerpt } from "../lib/together.js";

const analysisSchema = z.object({
  title: z.string(),
  whatChanged: z.string(),
  whyCare: z.string(),
  whatToDo: z.string(),
  worthReading: z.enum(["read", "skim", "skip"]),
  worthReason: z.string(),
});

const SYSTEM = `You write one digest card for a busy reader who acts on the first line they see.
Return JSON only: title, whatChanged, whyCare, whatToDo, worthReading, worthReason.
worthReading must be "read", "skim", or "skip".

Rules:
- whatToDo: lead with a concrete verb. If more than one step, number them "1. …\\n2. …". Max 3 steps. No preamble.
- whyCare: one short sentence. Why it matters now.
- whatChanged: one short sentence. Use "First time seeing this" when there is no prior.
- worthReason: one short sentence explaining the verdict.
- title: short and scannable.
- No filler ("In this article…", "It is important…", "Overall…"). No hype.`;

/**
 * Workflow task: Together chat → one action-first digest card.
 * `model` is chosen in the UI and passed through from the web orchestrator.
 */
export const analyzeItem = task(
  {
    name: "analyze_item",
    plan: "standard",
    timeoutSeconds: 180,
    retry: { maxRetries: 2, waitDurationMs: 5000, backoffScaling: 2 },
  },
  async function analyzeItem(
    title: string,
    sourceLabel: string,
    text: string,
    priorSummary: ItemAnalysis | null,
    contentChanged: boolean,
    model: string
  ): Promise<ItemAnalysis> {
    const priorBlock = priorSummary
      ? `\nPrior digest for this source:\n${JSON.stringify(priorSummary, null, 2)}\nContent changed since last run: ${contentChanged}`
      : "\nNo prior digest for this source.";

    const user = `Title: ${title}
Source: ${sourceLabel}
${priorBlock}

Content:
${excerpt(text, 8000)}

Fill the JSON fields. Prioritize whatToDo (action first), then whyCare, whatChanged, verdict.
If whatToDo has multiple steps, number them. Keep every field short.`;

    const parsed = await chatJson(SYSTEM, user, analysisSchema, model);

    return {
      title: parsed.title || title,
      sourceLabel,
      whatChanged: parsed.whatChanged,
      whyCare: parsed.whyCare,
      whatToDo: parsed.whatToDo,
      worthReading: parsed.worthReading,
      worthReason: parsed.worthReason,
    };
  }
);
