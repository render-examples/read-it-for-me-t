<script lang="ts">
  /** Digest summary: headline plus action lists. */
  import type { DigestResult } from "../lib/api";
  import { COPY } from "../lib/copy";
  import { findItemUrl } from "../lib/urls";

  let { result }: { result: DigestResult } = $props();

  type Section = {
    key: string;
    title: string;
    items: string[];
    linkable: boolean;
  };

  const sections = $derived<Section[]>([
    {
      key: "doToday",
      title: COPY.results.doToday,
      items: result.summary.doToday,
      linkable: true,
    },
    {
      key: "readNow",
      title: COPY.results.readNow,
      items: result.summary.readNow,
      linkable: true,
    },
    {
      key: "skip",
      title: COPY.results.skip,
      items: result.summary.skip,
      linkable: false,
    },
  ]);
</script>

<section class="summary" aria-labelledby="digest-summary-heading">
  <p class="summary-eyebrow">{COPY.results.summaryTitle}</p>
  <h2 id="digest-summary-heading">{result.summary.headline}</h2>

  {#each sections as section}
    <div class="summary-section">
      <h3>{section.title}</h3>
      {#if section.items.length}
        <ul>
          {#each section.items as item}
            {@const url = section.linkable ? findItemUrl(result.items, item) : null}
            <li>
              {#if url}
                <a class="summary-link" href={url} target="_blank" rel="noopener noreferrer">{item}</a>
              {:else}
                {item}
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="summary-empty">{COPY.results.emptySection}</p>
      {/if}
    </div>
  {/each}
</section>
