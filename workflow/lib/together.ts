/** Together AI adapter: JSON chat completions with retries for Render networking quirks. */
import Together from "together-ai";
import { z } from "zod";

const DEFAULT_MODEL =
  process.env.TOGETHER_MODEL || "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const MAX_ATTEMPTS = 3;

let client: Together | null = null;

function getClient(): Together {
  const key = process.env.TOGETHER_API_KEY?.trim();
  if (!key) throw new Error("TOGETHER_API_KEY is not set");
  if (!client) {
    client = new Together({
      apiKey: key,
      timeout: 120_000,
      maxRetries: 2,
      // node-fetch can throw ERR_STREAM_PREMATURE_CLOSE on Render; native fetch is stable.
      fetch: globalThis.fetch.bind(globalThis),
    });
  }
  return client;
}

function isRetryableTogetherError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("premature close") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("fetch failed")
  );
}

/**
 * Chat completion with JSON object response, validated by Zod.
 * Retries transient Render/network stream errors; uses the caller’s model or TOGETHER_MODEL.
 */
export async function chatJson<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
  model: string = DEFAULT_MODEL
): Promise<T> {
  let lastError: unknown;
  const resolvedModel = model.trim() || DEFAULT_MODEL;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await getClient().chat.completions.create({
        model: resolvedModel,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 1200,
      });

      const raw = response.choices[0]?.message?.content ?? "{}";
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("Together AI returned invalid JSON");
      }
      return schema.parse(parsed);
    } catch (err) {
      lastError = err;
      if (!isRetryableTogetherError(err) || attempt === MAX_ATTEMPTS) break;
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Together AI request failed");
}

/** Truncate long source text before sending it to the model. */
export function excerpt(text: string, max = 12000): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[truncated]`;
}
