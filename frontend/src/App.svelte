<script lang="ts">
  /** Main page: composer, live activity log, digest cards, and summary. */
  import type { AppConfig, DigestResult, ItemAnalysis, SseActivityPayload, SseProgressPayload } from "./lib/api";
  import { loadConfig, runDigestStream } from "./lib/api";
  import ActivityPanel from "./components/ActivityPanel.svelte";
  import DigestCard from "./components/DigestCard.svelte";
  import DigestSummary from "./components/DigestSummary.svelte";
  import Header from "./components/Header.svelte";
  import Footer from "./components/Footer.svelte";

  let config = $state<AppConfig | null>(null);
  let input = $state("");
  let focus = $state("");
  let files = $state<FileList | null>(null);
  let running = $state(false);
  let status = $state("");
  let error = $state("");
  let activities = $state<SseActivityPayload[]>([]);
  let progress = $state<SseProgressPayload | null>(null);
  let cards = $state<ItemAnalysis[]>([]);
  let result = $state<DigestResult | null>(null);

  const suggestions = [
    {
      title: "Summarize Render docs",
      subtitle: "paste a docs URL and see what changed",
      value: "https://render.com/docs/workflows",
    },
    {
      title: "Track product updates",
      subtitle: "drop in release notes or blog posts",
      value: "https://render.com/blog",
    },
    {
      title: "Weekly reading digest",
      subtitle: "paste notes and links from your queue",
      value: "https://www.together.ai/demos\nNotes from standup: shipped workflows beta",
    },
    {
      title: "Focus on AI infra",
      subtitle: "filter everything through one lens",
      value: "https://docs.together.ai/",
      focus: "AI infra and inference",
    },
  ];

  const hasResults = $derived(cards.length > 0 || result !== null);
  const showEmptyState = $derived(!hasResults && !running);

  $effect(() => {
    loadConfig()
      .then((c) => (config = c))
      .catch(() => (error = "Could not load app config"));
  });

  function applySuggestion(s: (typeof suggestions)[number]) {
    input = s.value;
    if (s.focus) focus = s.focus;
  }

  function splitInput(raw: string): { urls: string; text: string } {
    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const urlLines = lines.filter((line) => /^https?:\/\//i.test(line));
    const textLines = lines.filter((line) => !/^https?:\/\//i.test(line));
    return { urls: urlLines.join("\n"), text: textLines.join("\n") };
  }

  async function submit() {
    if (!config || running) return;
    const trimmed = input.trim();
    if (!trimmed && !files?.length) {
      error = "Add at least one URL, text line, or PDF";
      return;
    }

    running = true;
    error = "";
    cards = [];
    result = null;
    activities = [];
    progress = null;
    status = "Starting digest...";

    const { urls, text } = splitInput(input);
    const form = new FormData();
    form.set("urls", urls);
    form.set("text", text);
    form.set("focus", focus);
    if (files) {
      for (const file of files) form.append("pdfs", file);
    }

    await runDigestStream(form, {
      onStatus: (p) => {
        status = p.message;
      },
      onActivity: (p) => {
        activities = [...activities, p];
      },
      onProgress: (p) => {
        progress = p;
      },
      onCard: (p) => {
        cards = [...cards, p];
      },
      onDone: (p) => {
        result = p;
        status = "";
        progress = null;
        running = false;
      },
      onError: (p) => {
        error = p.message;
        progress = null;
        running = false;
      },
    });

    if (running) running = false;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  }
</script>

<div class="page">
  {#if config}
    <Header deployUrl={config.deployUrl} signupUrl={config.signupNavbar} />

    <main class="main">
      <div class="content">
        {#if showEmptyState}
          <section class="intro">
            <p class="intro-icons" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5M13.5 6L18 10.5M13.5 6V10.5H18" />
              </svg>
              <span>+</span>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </p>
            <p>
              Drop in links, pasted text, or PDFs. Each item answers what changed, why it
              matters, what to do, and whether it is worth reading fully. Powered by
              <a href="https://www.together.ai/" target="_blank" rel="noopener noreferrer">Together AI</a>
              on Render Workflows.
            </p>
          </section>
        {/if}

        {#if running || activities.length}
          <ActivityPanel {activities} {progress} headline={status} />
        {/if}

        {#if cards.length}
          <div class="cards">
            {#each cards as card}
              <DigestCard {card} />
            {/each}
          </div>
        {/if}

        {#if result}
          <DigestSummary {result} />
        {/if}

        {#if showEmptyState}
          <div class="suggestions">
            {#each suggestions as s}
              <button type="button" class="suggestion" onclick={() => applySuggestion(s)}>
                <span class="suggestion-title">{s.title}</span>
                <span class="suggestion-sub">{s.subtitle}</span>
              </button>
            {/each}
          </div>
        {/if}

        {#if error}
          <p class="error">{error}</p>
        {/if}
      </div>

      <form
        class="composer"
        onsubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <fieldset class="composer-field">
          <textarea
            rows="4"
            bind:value={input}
            onkeydown={onKeydown}
            placeholder="Paste URLs or text (one per line)..."
            disabled={running}
          ></textarea>
          <button type="submit" class="send-btn" disabled={running} aria-label="Build digest">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-.528 60.516 60.516 0 00-18.445-8.986z" />
            </svg>
          </button>
        </fieldset>

        <div class="composer-meta">
          <input
            type="text"
            class="focus-input"
            bind:value={focus}
            placeholder="Focus this week (optional)"
            disabled={running}
          />
          <label class="file-label">
            <input type="file" accept=".pdf" multiple bind:files disabled={running} />
            Attach PDF
          </label>
        </div>
      </form>
    </main>

    <Footer githubRepo={config.githubRepo} />
  {:else if error}
    <main class="main"><p class="error">{error}</p></main>
  {:else}
    <main class="main"><p class="status">Loading…</p></main>
  {/if}
</div>
