/** Frontend API client and manual SSE parser for /api/digest. */
import type {
  DigestResult,
  ItemAnalysis,
  SseActivityPayload,
  SseCardPayload,
  SseDonePayload,
  SseErrorPayload,
  SseProgressPayload,
  SseStagePayload,
  SseStatusPayload,
} from "../../../shared/types";

export type AppConfig = {
  githubRepo: string;
  deployUrl: string;
  signupNavbar: string;
  /** When true, App shows the detachable WorkflowTimeline module. */
  workflowTimeline: boolean;
  defaultModel: string;
};

export type TogetherChatModel = {
  id: string;
  displayName: string;
  organization: string;
  contextLength: number | null;
};

export type ModelsResponse = {
  models: TogetherChatModel[];
  defaultModel: string;
  source: "together" | "fallback";
};

/** Load chrome URLs and feature flags from the web service. */
export async function loadConfig(): Promise<AppConfig> {
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error("Failed to load config");
  return res.json();
}

/** Load Together chat models for the searchable picker. */
export async function loadModels(): Promise<ModelsResponse> {
  const res = await fetch("/api/models");
  if (!res.ok) throw new Error("Failed to load models");
  return res.json();
}

export type DigestStreamHandlers = {
  onStatus: (payload: SseStatusPayload) => void;
  onActivity: (payload: SseActivityPayload) => void;
  onProgress: (payload: SseProgressPayload) => void;
  onStage?: (payload: SseStagePayload) => void;
  onCard: (payload: SseCardPayload) => void;
  onDone: (payload: SseDonePayload) => void;
  onError: (payload: SseErrorPayload) => void;
};

/** POST multipart form and parse SSE response manually. */
export async function runDigestStream(
  form: FormData,
  handlers: DigestStreamHandlers
): Promise<void> {
  const res = await fetch("/api/digest", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    handlers.onError({ message: body.error ?? `Request failed (${res.status})` });
    return;
  }
  if (!res.body) {
    handlers.onError({ message: "No response stream" });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = consumeSse(buffer, handlers);
  }
}

/** Parse complete SSE frames from the stream buffer; return the incomplete tail. */
function consumeSse(buffer: string, handlers: DigestStreamHandlers): string {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    if (!part.trim() || part.startsWith(":")) continue;
    let event = "message";
    let data = "";
    for (const line of part.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      if (line.startsWith("data:")) data += line.slice(5).trim();
    }
    if (!data) continue;
    const payload = JSON.parse(data);
    if (event === "status") handlers.onStatus(payload);
    else if (event === "activity") handlers.onActivity(payload);
    else if (event === "progress") handlers.onProgress(payload);
    else if (event === "stage") handlers.onStage?.(payload);
    else if (event === "card") handlers.onCard(payload);
    else if (event === "done") handlers.onDone(payload);
    else if (event === "error") handlers.onError(payload);
  }

  return rest;
}

export type {
  ItemAnalysis,
  DigestResult,
  SseActivityPayload,
  SseProgressPayload,
  SseStagePayload,
};
