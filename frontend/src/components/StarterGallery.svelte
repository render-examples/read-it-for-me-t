<script lang="ts">
  /** Visual starter collections inspired by v0's template gallery. */
  import { COPY, type StarterCollection } from "../lib/copy";

  let {
    onSelect,
  }: {
    onSelect: (collection: StarterCollection) => void;
  } = $props();
</script>

<section class="starter-gallery" aria-labelledby="starter-gallery-title">
  <div class="starter-gallery-head">
    <h2 id="starter-gallery-title">Start with a collection</h2>
    <span>Current feeds</span>
  </div>

  <div class="collection-grid">
    {#each COPY.collections as collection}
      <button
        type="button"
        class="collection-card"
        onclick={() => onSelect(collection)}
        aria-label={`Load ${collection.title} from ${collection.sources.join(" and ")}`}
      >
        <span class={`collection-cover collection-cover--${collection.art}`} aria-hidden="true">
          {#if collection.art === "ideas"}
            <span class="cover-mark cover-mark--quote">“</span>
            <span class="cover-rule"></span>
            <span class="cover-word">IDEAS</span>
          {:else if collection.art === "science"}
            <svg class="cover-orbit" viewBox="0 0 240 140">
              <ellipse cx="120" cy="70" rx="78" ry="28"></ellipse>
              <ellipse cx="120" cy="70" rx="78" ry="28" transform="rotate(60 120 70)"></ellipse>
              <ellipse cx="120" cy="70" rx="78" ry="28" transform="rotate(120 120 70)"></ellipse>
              <circle cx="120" cy="70" r="8"></circle>
            </svg>
          {:else}
            <span class="cover-book cover-book--one"></span>
            <span class="cover-book cover-book--two"></span>
            <span class="cover-book cover-book--three"></span>
          {/if}

          <span class="cover-sources">{collection.sources.join(" / ")}</span>
        </span>

        <span class="collection-meta">
          <span class="collection-title">{collection.title}</span>
          <span class="collection-count">{collection.sources.length} sources</span>
        </span>
      </button>
    {/each}
  </div>
</section>
