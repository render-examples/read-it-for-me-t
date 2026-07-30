/** Pure builder: stage SSE events → clock-time Gantt model. No UI imports. */
import { STAGE_LABEL } from "./format";
import type {
  StageEvent,
  TimelineRow,
  TimelineSpan,
  TimelineStageName,
  WorkflowTimelineModel,
} from "./types";

type OpenSpan = {
  key: string;
  stage: TimelineStageName;
  attempt: number;
  startMs: number;
};

function eventMs(event: StageEvent): number {
  const value = new Date(event.at).getTime();
  return Number.isFinite(value) ? value : 0;
}

/**
 * Builds a live execution timeline from ordered stage events.
 * Safe to call on every SSE tick; open spans extend to nowMs while active.
 */
export function buildWorkflowTimeline(args: {
  events: StageEvent[];
  nowMs: number;
  active: boolean;
}): WorkflowTimelineModel {
  const events = [...args.events].sort((a, b) => a.id - b.id);
  const rowOrder: string[] = [];
  const labels = new Map<string, string>();
  const byRow = new Map<string, StageEvent[]>();

  for (const event of events) {
    if (!labels.has(event.rowId)) {
      rowOrder.push(event.rowId);
      labels.set(event.rowId, event.rowLabel);
    }
    const list = byRow.get(event.rowId) ?? [];
    list.push(event);
    byRow.set(event.rowId, list);
  }

  const firstMs = events.map(eventMs).find((value) => value > 0);
  const startMs = firstMs ?? args.nowMs;
  const endMs = Math.max(startMs + 1, args.nowMs);

  const rows: TimelineRow[] = rowOrder.map((rowId) => {
    const rowEvents = byRow.get(rowId) ?? [];
    const spans: TimelineSpan[] = [];
    const open = new Map<string, OpenSpan>();
    let failed = false;
    let failureReason: string | undefined;

    for (const event of rowEvents) {
      const at = eventMs(event);
      const attempt = event.attempt && event.attempt > 0 ? event.attempt : 1;
      const key = `${event.stage}:${attempt}`;

      if (event.status === "started") {
        open.set(key, { key, stage: event.stage, attempt, startMs: at });
        continue;
      }

      if (event.status === "completed" || event.status === "failed") {
        const pending = open.get(key);
        const latencyMs =
          event.latencyMs && event.latencyMs > 0
            ? event.latencyMs
            : pending
              ? Math.max(0, at - pending.startMs)
              : 0;
        const spanStart = pending?.startMs ?? Math.max(startMs, at - latencyMs);
        spans.push({
          key: `${rowId}:${key}:${event.status}`,
          stage: event.stage,
          label: STAGE_LABEL[event.stage] ?? event.stage,
          attempt,
          startMs: spanStart,
          endMs: Math.max(spanStart, at),
          latencyMs,
          status: event.status === "failed" ? "failed" : "complete",
        });
        open.delete(key);
        if (event.status === "failed") {
          failed = true;
          if (event.message?.trim()) failureReason = event.message.trim();
        }
      }
    }

    if (args.active) {
      for (const pending of open.values()) {
        spans.push({
          key: `${rowId}:${pending.key}:running`,
          stage: pending.stage,
          label: STAGE_LABEL[pending.stage] ?? pending.stage,
          attempt: pending.attempt,
          startMs: pending.startMs,
          endMs,
          latencyMs: Math.max(0, endMs - pending.startMs),
          status: "running",
        });
      }
    }

    spans.sort((a, b) => a.startMs - b.startMs || a.attempt - b.attempt);
    const hasRunning = spans.some((span) => span.status === "running");
    const hasComplete = spans.some((span) => span.status === "complete");

    return {
      rowId,
      label: labels.get(rowId) ?? rowId,
      failureReason,
      status: hasRunning
        ? "running"
        : failed
          ? "failed"
          : hasComplete && open.size === 0
            ? "complete"
            : spans.length > 0
              ? "running"
              : "pending",
      spans,
    };
  });

  return {
    startMs,
    endMs,
    durationMs: Math.max(1, endMs - startMs),
    rows,
  };
}
