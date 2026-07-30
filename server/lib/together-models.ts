/** Fetch and cache Together AI chat models for the picker UI. */
import Together from "together-ai";

export type TogetherChatModel = {
  id: string;
  displayName: string;
  organization: string;
  contextLength: number | null;
};

const DEFAULT_MODEL =
  process.env.TOGETHER_MODEL?.trim() || "meta-llama/Llama-3.3-70B-Instruct-Turbo";

const CACHE_TTL_MS = 15 * 60 * 1000;

let cache: { at: number; models: TogetherChatModel[] } | null = null;

/** Default model id used when the client sends none. */
export function defaultTogetherModel(): string {
  return DEFAULT_MODEL;
}

/** Validate a model id string (org/name shape). */
export function isPlausibleModelId(id: string): boolean {
  return (
    /^[a-zA-Z0-9][\w.-]*\/[a-zA-Z0-9][\w.+:-]*$/.test(id) && id.length <= 200
  );
}

/**
 * Lists chat models from Together (cached).
 * Falls back to the default model only when the API key is missing or the call fails.
 */
export async function listChatModels(): Promise<{
  models: TogetherChatModel[];
  defaultModel: string;
  source: "together" | "fallback";
}> {
  const key = process.env.TOGETHER_API_KEY?.trim();
  if (!key) {
    return {
      models: [fallbackModel()],
      defaultModel: DEFAULT_MODEL,
      source: "fallback",
    };
  }

  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return {
      models: cache.models,
      defaultModel: DEFAULT_MODEL,
      source: "together",
    };
  }

  try {
    const client = new Together({
      apiKey: key,
      timeout: 30_000,
      maxRetries: 1,
      fetch: globalThis.fetch.bind(globalThis),
    });
    const listed = await client.models.list();
    const models = listed
      .filter((m) => m.type === "chat" && typeof m.id === "string" && m.id.length > 0)
      .map((m) => ({
        id: m.id,
        displayName: m.display_name?.trim() || m.id,
        organization: m.organization?.trim() || m.id.split("/")[0] || "Together",
        contextLength: typeof m.context_length === "number" ? m.context_length : null,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    if (!models.some((m) => m.id === DEFAULT_MODEL)) {
      models.unshift(fallbackModel());
    }

    cache = { at: Date.now(), models };
    return { models, defaultModel: DEFAULT_MODEL, source: "together" };
  } catch (err) {
    console.warn("Together models.list failed; using fallback", err);
    return {
      models: [fallbackModel()],
      defaultModel: DEFAULT_MODEL,
      source: "fallback",
    };
  }
}

function fallbackModel(): TogetherChatModel {
  return {
    id: DEFAULT_MODEL,
    displayName: "Llama 3.3 70B Instruct Turbo",
    organization: "Meta",
    contextLength: null,
  };
}
