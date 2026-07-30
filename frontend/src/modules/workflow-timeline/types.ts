/** Public types for the detachable workflow timeline module. */

export type TimelineStageName = "fetch" | "analyze" | "synthesize";

export type StageEvent = {
  id: number;
  rowId: string;
  rowLabel: string;
  stage: TimelineStageName;
  status: "started" | "completed" | "failed";
  at: string;
  attempt?: number;
  latencyMs?: number;
  message?: string;
};

export type TimelineSpan = {
  key: string;
  stage: TimelineStageName;
  label: string;
  attempt: number;
  startMs: number;
  endMs: number;
  status: "complete" | "running" | "failed";
  latencyMs: number;
};

export type TimelineRow = {
  rowId: string;
  label: string;
  status: "pending" | "running" | "complete" | "failed";
  failureReason?: string;
  spans: TimelineSpan[];
};

export type WorkflowTimelineModel = {
  startMs: number;
  endMs: number;
  durationMs: number;
  rows: TimelineRow[];
};
