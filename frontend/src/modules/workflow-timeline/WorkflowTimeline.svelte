<script lang="ts">
  /** Live Gantt of Render Workflow stages for the current digest run. */
  import { onDestroy } from "svelte";
  import { COPY } from "../../lib/copy";
  import { buildWorkflowTimeline } from "./build";
  import { formatDuration, spanPosition, STAGE_LABEL } from "./format";
  import type { StageEvent } from "./types";
  import "./workflow-timeline.css";

  let {
    events,
    active,
    headline = COPY.timeline.title,
  }: {
    events: StageEvent[];
    active: boolean;
    headline?: string;
  } = $props();

  let nowMs = $state(Date.now());
  let timer: ReturnType<typeof setInterval> | null = null;

  $effect(() => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (active) {
      nowMs = Date.now();
      timer = setInterval(() => {
        nowMs = Date.now();
      }, 250);
    }
  });

  onDestroy(() => {
    if (timer) clearInterval(timer);
  });

  const timeline = $derived(buildWorkflowTimeline({ events, nowMs, active }));
  const stages = ["fetch", "analyze", "synthesize"] as const;

  function rowDurationMs(row: (typeof timeline.rows)[number]): number {
    if (!row.spans.length) return 0;
    const start = Math.min(...row.spans.map((s) => s.startMs));
    const end = Math.max(...row.spans.map((s) => s.endMs));
    return Math.max(0, end - start);
  }
</script>

<section class="workflow-timeline" aria-live="polite">
  <div class="workflow-timeline__head">
    <div>
      <h2 class="workflow-timeline__title">{headline}</h2>
      <p class="workflow-timeline__hint">{COPY.timeline.hint}</p>
    </div>
    <span class="workflow-timeline__elapsed">
      {active ? `${COPY.timeline.live} · ` : ""}{formatDuration(timeline.durationMs)}
    </span>
  </div>

  <div class="workflow-timeline__legend" aria-label="Stage legend">
    {#each stages as stage}
      <span class={`workflow-legend workflow-legend--${stage}`}>
        <span aria-hidden="true"></span>
        {STAGE_LABEL[stage]}
      </span>
    {/each}
  </div>

  <div class="workflow-timeline__chart">
    <div class="workflow-timeline__axis" aria-hidden="true">
      {#each [0, 25, 50, 75, 100] as tick}
        <span
          style={`left: calc(var(--execution-label-w) + 0.8rem + (100% - var(--execution-label-w) - 0.8rem) * ${tick / 100})`}
        >
          {formatDuration((timeline.durationMs * tick) / 100)}
        </span>
      {/each}
    </div>

    {#each timeline.rows as row (row.rowId)}
      {@const duration = rowDurationMs(row)}
      <div class="workflow-row">
        <div class="workflow-row__label">
          <p class="workflow-row__name" title={row.label}>{row.label}</p>
          <div class="workflow-row__meta">
            <span
              class={`workflow-badge workflow-badge--${row.status}`}
              title={row.failureReason ?? row.status}
            >
              {row.status}
            </span>
            {#if duration > 0}
              <span class="workflow-row__duration">{formatDuration(duration)}</span>
            {/if}
          </div>
        </div>
        <div
          class="workflow-row__track"
          role="img"
          aria-label={`${row.label}: ${row.status}${duration ? `, ${formatDuration(duration)}` : ""}`}
        >
          {#each [0, 25, 50, 75, 100] as tick}
            <span
              class="workflow-row__gridline"
              style={`left: ${tick}%`}
              aria-hidden="true"
            ></span>
          {/each}
          {#each row.spans as span (span.key)}
            {@const position = spanPosition(span, timeline)}
            {@const title = `${span.label} · ${formatDuration(span.latencyMs)} · ${span.status}`}
            <span
              class={`workflow-span workflow-span--${span.stage} workflow-span--${span.status}`}
              style={`left: ${position.left}%; width: ${position.width}%`}
              {title}
              aria-label={title}
            >
              {position.width >= 12 ? span.label : ""}
            </span>
          {/each}
        </div>
      </div>
    {/each}

    {#if timeline.rows.length === 0}
      <p class="workflow-timeline__empty">{COPY.timeline.waiting}</p>
    {/if}
  </div>
</section>
