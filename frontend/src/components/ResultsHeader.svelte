<script lang="ts">
  /** Results toolbar: item count and New digest action. */
  import { COPY } from "../lib/copy";

  let {
    count,
    streaming = false,
    onNewDigest,
  }: {
    count: number;
    streaming?: boolean;
    onNewDigest: () => void;
  } = $props();
</script>

<div class="results-header">
  <p class="results-count">
    {streaming ? COPY.results.itemsStreaming(count) : COPY.results.itemsReady(count)}
  </p>
  <button type="button" class="btn btn-ghost" onclick={onNewDigest}>
    {COPY.app.newDigest}
  </button>
</div>
