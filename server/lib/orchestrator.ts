/** Digest orchestration: starts Render Workflow tasks and streams live SSE updates. */
import crypto from "node:crypto";
import { Render } from "@renderinc/sdk";
import type {
  DigestItemInput,
  DigestResult,
  DigestStageName,
  DigestSummary,
  ItemAnalysis,
  SseActivityPayload,
  SseProgressPayload,
  SseStagePayload,
} from "../../shared/types.js";
import { createRun, getPriorSnapshot, saveRun } from "./db.js";

const WORKFLOW_SLUG = process.env.WORKFLOW_SLUG || "read-it-for-me-workflow";
const POLL_MS = parseInt(process.env.POLL_INTERVAL_MS || "1500", 10);

type StreamChunk = { event: string; data: unknown };

let render: Render | null = null;
let activitySeq = 0;

function getRender(): Render {
  if (!render) render = new Render();
  return render;
}

function hashText(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function sourceKeyForItem(item: DigestItemInput, index: number): string {
  if (item.kind === "url") return `url:${item.value}`;
  if (item.kind === "text") return `text:${hashText(item.value).slice(0, 16)}`;
  return `pdf:${item.filename}:${index}`;
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "page";
  }
}

function itemLabel(item: DigestItemInput): string {
  if (item.kind === "url") return item.value;
  if (item.kind === "text") {
    const preview = item.value.replace(/\s+/g, " ").slice(0, 72);
    return preview.length < item.value.length ? `${preview}…` : preview;
  }
  return item.filename;
}

function rowLabelForItem(item: DigestItemInput, index: number): string {
  if (item.kind === "url") return safeHostname(item.value);
  if (item.kind === "text") return `Text ${index + 1}`;
  return item.filename.slice(0, 28);
}

function activity(
  message: string,
  kind: SseActivityPayload["kind"] = "info"
): StreamChunk {
  activitySeq += 1;
  return {
    event: "activity",
    data: { id: `a-${activitySeq}`, message, kind } satisfies SseActivityPayload,
  };
}

function progress(task: string, message: string, elapsedSec: number): StreamChunk {
  return {
    event: "progress",
    data: { task, message, elapsedSec } satisfies SseProgressPayload,
  };
}

function stage(payload: SseStagePayload): StreamChunk {
  return { event: "stage", data: payload };
}

function taskStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Queued on Render Workflows";
    case "running":
      return "Running on Render Workflows";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "canceled":
      return "Canceled";
    default:
      return status;
  }
}

async function* runTask<T>(
  taskName: string,
  label: string,
  args: unknown[],
  meta: { rowId: string; rowLabel: string; stage: DigestStageName }
): AsyncGenerator<StreamChunk, T, undefined> {
  const attempt = 1;
  const stageStartedAt = Date.now();
  yield stage({
    rowId: meta.rowId,
    rowLabel: meta.rowLabel,
    stage: meta.stage,
    status: "started",
    at: new Date(stageStartedAt).toISOString(),
    attempt,
  });
  yield activity(`Starting ${label}`, "info");

  try {
    const started = await getRender().workflows.startTask(`${WORKFLOW_SLUG}/${taskName}`, args);
    yield activity(`Task run ${started.taskRunId.slice(-8)} created`, "info");

    const startedAt = Date.now();
    let lastStatus = "";

    // Poll Render until the task finishes; yield activity/progress on each tick.
    while (true) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      const details = await getRender().workflows.getTaskRun(started.taskRunId);
      const elapsedSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

      if (details.status !== lastStatus) {
        lastStatus = details.status;
        yield activity(`${label}: ${taskStatusLabel(details.status)}`, "wait");
      }

      if (details.status === "pending" || details.status === "running") {
        yield progress(taskName, `${label} (${taskStatusLabel(details.status).toLowerCase()})`, elapsedSec);
        continue;
      }

      if (details.status === "completed") {
        const endedAt = Date.now();
        yield stage({
          rowId: meta.rowId,
          rowLabel: meta.rowLabel,
          stage: meta.stage,
          status: "completed",
          at: new Date(endedAt).toISOString(),
          attempt,
          latencyMs: endedAt - stageStartedAt,
        });
        yield activity(`${label} finished in ${elapsedSec}s`, "success");
        return (details.results?.[0] ?? null) as T;
      }

      if (details.status === "failed" || details.status === "canceled") {
        throw new Error(details.error ?? `Task ${taskName} failed`);
      }
    }
  } catch (err) {
    const endedAt = Date.now();
    const message = err instanceof Error ? err.message : String(err);
    yield stage({
      rowId: meta.rowId,
      rowLabel: meta.rowLabel,
      stage: meta.stage,
      status: "failed",
      at: new Date(endedAt).toISOString(),
      attempt,
      latencyMs: endedAt - stageStartedAt,
      message,
    });
    throw err;
  }
}

export async function* runDigest(
  items: DigestItemInput[],
  focus: string
): AsyncGenerator<StreamChunk> {
  activitySeq = 0;
  const runId = await createRun(focus);
  const total = items.length;
  const analyses: ItemAnalysis[] = [];
  const sourceKeys: string[] = [];
  const contentHashes: string[] = [];

  yield {
    event: "status",
    data: { phase: "start", message: `Processing ${total} item(s)...`, total },
  };
  yield activity(`Digest run #${runId} started`, "info");

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const sourceKey = sourceKeyForItem(item, i);
    sourceKeys.push(sourceKey);
    const label = itemLabel(item);
    const rowId = `item-${i}`;
    const rowLabel = rowLabelForItem(item, i);

    yield {
      event: "status",
      data: {
        phase: "fetch",
        message: `Fetching item ${i + 1} of ${total}...`,
        index: i,
        total,
      },
    };
    yield activity(`Item ${i + 1}/${total}: ${label}`, "info");

    const fetchRunner = runTask<{ title: string; text: string; sourceLabel: string }>(
      "fetch_item",
      item.kind === "url" ? `Fetch ${safeHostname(item.value)}` : `Load ${label.slice(0, 40)}`,
      [item],
      { rowId, rowLabel, stage: "fetch" }
    );
    let fetched!: { title: string; text: string; sourceLabel: string };
    // Drain the async generator so activity events reach the client while the task runs.
    while (true) {
      const step = await fetchRunner.next();
      if (step.done) {
        fetched = step.value;
        break;
      }
      yield step.value;
    }

    yield activity(`Fetched “${fetched.title}” (${fetched.text.length.toLocaleString()} chars)`, "success");

    const contentHash = hashText(fetched.text);
    contentHashes.push(contentHash);

    const prior = await getPriorSnapshot(sourceKey);
    if (prior) {
      yield activity(
        prior.contentHash === contentHash
          ? "Content unchanged since last digest"
          : "Content changed since last digest",
        "info"
      );
    } else {
      yield activity("First time seeing this source", "info");
    }

    yield {
      event: "status",
      data: {
        phase: "analyze",
        message: `Analyzing item ${i + 1} with Together AI...`,
        index: i,
        total,
      },
    };

    const analyzeRunner = runTask<ItemAnalysis>(
      "analyze_item",
      "Together AI analysis",
      [
        fetched.title,
        fetched.sourceLabel,
        fetched.text,
        focus,
        prior?.summary ?? null,
        prior ? contentHash !== prior.contentHash : false,
      ],
      { rowId, rowLabel, stage: "analyze" }
    );
    let analyzed!: ItemAnalysis;
    while (true) {
      const step = await analyzeRunner.next();
      if (step.done) {
        analyzed = step.value;
        break;
      }
      yield step.value;
    }

    analyses.push(analyzed);
    yield activity(`Analysis ready: ${analyzed.worthReading} — ${analyzed.title}`, "success");
    yield { event: "card", data: { ...analyzed, index: i } };
  }

  yield {
    event: "status",
    data: { phase: "synthesize", message: "Building your digest summary..." },
  };

  const synthRunner = runTask<DigestSummary>(
    "synthesize_digest",
    "Digest summary",
    [analyses, focus],
    { rowId: "digest", rowLabel: "Digest", stage: "synthesize" }
  );
  let summary!: DigestSummary;
  while (true) {
    const step = await synthRunner.next();
    if (step.done) {
      summary = step.value;
      break;
    }
    yield step.value;
  }

  yield activity("Saving results to Postgres", "info");
  await saveRun(runId, analyses, sourceKeys, contentHashes, summary);
  yield activity("Digest complete", "success");

  const result: DigestResult = { runId, focus, items: analyses, summary };
  yield { event: "done", data: result };
}
