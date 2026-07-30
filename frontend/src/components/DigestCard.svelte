<script lang="ts">
  /** Single digest item card with human-readable verdict. */
  import type { ItemAnalysis } from "../lib/api";
  import { COPY, verdictLabel } from "../lib/copy";
  import { isHttpUrl, urlHostname } from "../lib/urls";

  let { card }: { card: ItemAnalysis } = $props();

  const sourceUrl = $derived(isHttpUrl(card.sourceLabel) ? card.sourceLabel : null);
  const sourceDisplay = $derived(
    sourceUrl ? urlHostname(sourceUrl) : card.sourceLabel
  );
  const verdict = $derived(verdictLabel(card.worthReading));
  const badgeClass = $derived(`badge badge-${card.worthReading}`);
</script>

<article class="card">
  <span class={badgeClass} aria-label={verdict}>{verdict}</span>
  <h3 class="card-title">
    {#if sourceUrl}
      <a class="card-link" href={sourceUrl} target="_blank" rel="noopener noreferrer">
        {card.title}
      </a>
    {:else}
      {card.title}
    {/if}
  </h3>
  <p class="source">
    {#if sourceUrl}
      <a class="card-link muted" href={sourceUrl} target="_blank" rel="noopener noreferrer">
        {sourceDisplay}
      </a>
    {:else}
      {card.sourceLabel}
    {/if}
  </p>
  <dl class="card-fields">
    <div>
      <dt>{COPY.results.whatChanged}</dt>
      <dd>{card.whatChanged}</dd>
    </div>
    <div>
      <dt>{COPY.results.whyCare}</dt>
      <dd>{card.whyCare}</dd>
    </div>
    <div>
      <dt>{COPY.results.whatToDo}</dt>
      <dd>{card.whatToDo}</dd>
    </div>
    <div>
      <dt>{COPY.results.verdictReason}</dt>
      <dd>{card.worthReason}</dd>
    </div>
  </dl>
</article>
