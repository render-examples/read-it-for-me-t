<script lang="ts">
  /** Single placement for Deploy + Sign up on Render links. */
  let {
    deployUrl,
    signupUrl,
  }: {
    deployUrl: string;
    signupUrl: string;
  } = $props();
</script>

<div class="render-ctas">
  <a
    class="render-deploy"
    href={deployUrl}
    target="_blank"
    rel="noopener noreferrer"
  >
    <span class="render-cta-full">Deploy to Render</span>
    <span class="render-cta-short">Deploy</span>
  </a>
  <a
    class="render-signup"
    href={signupUrl}
    target="_blank"
    rel="noopener noreferrer"
  >
    <span class="render-cta-full">Sign up on Render</span>
    <span class="render-cta-short">Sign up</span>
  </a>
</div>
