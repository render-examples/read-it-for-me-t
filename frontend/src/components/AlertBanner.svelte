<script lang="ts">
  /** Accessible alert with optional recovery actions. */
  let {
    message,
    tone = "error",
    primaryLabel,
    onPrimary,
    secondaryLabel,
    onSecondary,
  }: {
    message: string;
    tone?: "error" | "info";
    primaryLabel?: string;
    onPrimary?: () => void;
    secondaryLabel?: string;
    onSecondary?: () => void;
  } = $props();
</script>

<div
  class="alert"
  class:alert-error={tone === "error"}
  class:alert-info={tone === "info"}
  role={tone === "error" ? "alert" : "status"}
  aria-live={tone === "error" ? "assertive" : "polite"}
>
  <p class="alert-message">{message}</p>
  {#if primaryLabel || secondaryLabel}
    <div class="alert-actions">
      {#if primaryLabel && onPrimary}
        <button type="button" class="btn btn-primary" onclick={onPrimary}>
          {primaryLabel}
        </button>
      {/if}
      {#if secondaryLabel && onSecondary}
        <button type="button" class="btn btn-ghost" onclick={onSecondary}>
          {secondaryLabel}
        </button>
      {/if}
    </div>
  {/if}
</div>
