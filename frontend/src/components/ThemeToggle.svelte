<script lang="ts">
  /** Toggle between light and dark color schemes. */
  let theme = $state<"light" | "dark">(
    (typeof document !== "undefined" &&
      (document.documentElement.getAttribute("data-theme") as "light" | "dark")) ||
      "light"
  );

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    theme = next;
    localStorage.setItem("rifm-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  const label = $derived(theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
</script>

<button type="button" class="theme-toggle" onclick={toggle} aria-label={label} title={label}>
  {#if theme === "dark"}
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" />
      <path
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
  {:else}
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      />
    </svg>
  {/if}
</button>
