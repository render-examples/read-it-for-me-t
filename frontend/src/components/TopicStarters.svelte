<script lang="ts">
  /** Compact topic shortcuts displayed directly below the composer. */
  import { COPY, type Suggestion } from "../lib/copy";

  let {
    onSelect,
  }: {
    onSelect: (suggestion: Suggestion) => void;
  } = $props();
</script>

<div class="suggestions" aria-label="Start with a topic">
  {#each COPY.suggestions as suggestion}
    <button
      type="button"
      class="suggestion"
      onclick={() => onSelect(suggestion)}
    >
      <span aria-hidden="true">+</span>
      {suggestion.label}
    </button>
  {/each}
</div>
