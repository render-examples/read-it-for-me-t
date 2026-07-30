<script lang="ts">
  /** Site header: brand, theme toggle, Deploy + Sign up. */
  import RenderCtas from "./RenderCtas.svelte";
  import ThemeToggle from "./ThemeToggle.svelte";

  let {
    deployUrl,
    signupUrl,
  }: {
    deployUrl: string;
    signupUrl: string;
  } = $props();
</script>

<header class="site-header">
  <div class="header-inner">
    <a href="/" class="brand">
      <img src="/favicon.svg" alt="" width="24" height="24" class="brand-mark" />
      <span class="brand-name">Read It For Me</span>
      <span class="brand-rule" aria-hidden="true"></span>
      <span class="brand-subtitle">Daily digest for links and docs</span>
    </a>

    <nav class="nav" aria-label="Render actions">
      <ThemeToggle />
      <span class="nav-divider" aria-hidden="true"></span>
      <RenderCtas {deployUrl} {signupUrl} />
    </nav>
  </div>
</header>
