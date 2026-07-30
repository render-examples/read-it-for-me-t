<script lang="ts">
  /** Footer with GitHub and Workflows docs (centered, sticky via page flex). */
  const WORKFLOWS_DOCS_URL = "https://render.com/docs/workflows";

  let {
    githubRepo,
  }: {
    githubRepo: string;
  } = $props();
</script>

<footer class="site-footer">
  <div class="footer-inner">
    <a class="footer-link" href={githubRepo} target="_blank" rel="noopener noreferrer">
      GitHub repository
    </a>
    <a class="footer-link" href={WORKFLOWS_DOCS_URL} target="_blank" rel="noopener noreferrer">
      Workflows docs
    </a>
  </div>
</footer>
