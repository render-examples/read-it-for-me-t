/**
 * Detachable Workflow execution timeline (Answer Arena–style Gantt).
 *
 * To detach:
 * 1. Delete `frontend/src/modules/workflow-timeline/`
 * 2. Remove the import + usage in `frontend/src/App.svelte`
 * 3. Optional: drop `onStage` from `frontend/src/lib/api.ts` and `stage`
 *    SSE yields in `server/lib/orchestrator.ts` (safe to leave; ignored)
 * 4. Optional: remove `workflowTimeline` from `/api/config`
 *
 * Toggle without deleting: set `ENABLE_WORKFLOW_TIMELINE=0` on the web service.
 */
export { buildWorkflowTimeline } from "./build.js";
export { formatDuration, spanPosition, STAGE_LABEL } from "./format.js";
export type {
  StageEvent,
  TimelineRow,
  TimelineSpan,
  TimelineStageName,
  WorkflowTimelineModel,
} from "./types.js";
export { default as WorkflowTimeline } from "./WorkflowTimeline.svelte";
