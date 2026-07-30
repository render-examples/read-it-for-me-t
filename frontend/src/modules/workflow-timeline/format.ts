/** Duration and span layout helpers for the workflow Gantt. */
import type { TimelineSpan, WorkflowTimelineModel } from "./types";

/** Display labels for stage keys shown in the legend and tooltips. */
export const STAGE_LABEL: Record<string, string> = {
  fetch: "Fetch",
  analyze: "Analyze",
  synthesize: "Synthesize",
};

/** Human-readable duration for span labels (ms → s → m s). */
export function formatDuration(ms: number): string {
  if (ms < 1_000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1_000).toFixed(ms < 10_000 ? 1 : 0)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1_000)}s`;
}

/**
 * Map a span onto the timeline track as CSS % left/width.
 * Direction is LTR: earlier starts sit further left.
 */
export function spanPosition(
  span: TimelineSpan,
  timeline: Pick<WorkflowTimelineModel, "startMs" | "durationMs">
): { left: number; width: number } {
  const left = ((span.startMs - timeline.startMs) / timeline.durationMs) * 100;
  const width = ((span.endMs - span.startMs) / timeline.durationMs) * 100;
  return {
    left: Math.max(0, Math.min(100, left)),
    width: Math.max(0.8, Math.min(100 - left, width)),
  };
}
