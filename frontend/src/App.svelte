<script lang="ts">
  /** Composition root: digest phases, composer, workflow feedback, results. */
  import { loadConfig, loadModels, runDigestStream } from "./lib/api";
  import type {
    AppConfig,
    DigestResult,
    ItemAnalysis,
    SseActivityPayload,
    SseProgressPayload,
    SseStagePayload,
    TogetherChatModel,
  } from "./lib/api";
  import {
    COPY,
    type StarterCollection,
    type Suggestion,
  } from "./lib/copy";
  import { deriveDigestPhase } from "./lib/phase";
  import { splitComposerInput, validateComposerInput } from "./lib/composer";
  import ActivityPanel from "./components/ActivityPanel.svelte";
  import AlertBanner from "./components/AlertBanner.svelte";
  import DigestCard from "./components/DigestCard.svelte";
  import DigestComposer from "./components/DigestComposer.svelte";
  import DigestSummary from "./components/DigestSummary.svelte";
  import EmptyState from "./components/EmptyState.svelte";
  import Footer from "./components/Footer.svelte";
  import Header from "./components/Header.svelte";
  import ResultsHeader from "./components/ResultsHeader.svelte";
  import StarterGallery from "./components/StarterGallery.svelte";
  import TopicStarters from "./components/TopicStarters.svelte";
  import {
    WorkflowTimeline,
    type StageEvent,
  } from "./modules/workflow-timeline";

  let config = $state<AppConfig | null>(null);
  let configLoaded = $state(false);
  let input = $state("");
  let modelId = $state("");
  let models = $state<TogetherChatModel[]>([]);
  let modelsLoading = $state(true);
  let pdfs = $state<File[]>([]);
  let running = $state(false);
  let status = $state("");
  let error = $state("");
  let validationError = $state("");
  let activities = $state<SseActivityPayload[]>([]);
  let progress = $state<SseProgressPayload | null>(null);
  let stageEvents = $state<StageEvent[]>([]);
  let stageSeq = $state(0);
  let cards = $state<ItemAnalysis[]>([]);
  let result = $state<DigestResult | null>(null);

  const phase = $derived(
    deriveDigestPhase({
      running,
      hasCards: cards.length > 0,
      hasResult: result !== null,
      hasError: Boolean(error),
      configLoaded,
    })
  );

  const showEmptyState = $derived(phase === "empty");
  const showTimeline = $derived(
    Boolean(config?.workflowTimeline) && (running || stageEvents.length > 0)
  );
  const showActivityFallback = $derived(
    !config?.workflowTimeline && (running || activities.length > 0)
  );
  const showResultsChrome = $derived(
    cards.length > 0 || result !== null || phase === "partial"
  );
  const timelineHeadline = $derived(
    status ||
      (progress?.message ?? COPY.timeline.title)
  );

  $effect(() => {
    loadConfig()
      .then((c) => {
        config = c;
        configLoaded = true;
        if (!modelId) modelId = c.defaultModel;
      })
      .catch(() => {
        error = COPY.errors.config;
        configLoaded = false;
      });

    loadModels()
      .then((payload) => {
        models = payload.models;
        if (!modelId) modelId = payload.defaultModel;
        modelsLoading = false;
      })
      .catch(() => {
        modelsLoading = false;
      });
  });

  function applySuggestion(s: Suggestion | StarterCollection) {
    input = s.value;
    validationError = "";
    error = "";
    requestAnimationFrame(() => {
      document.querySelector<HTMLTextAreaElement>("#digest-input")?.focus();
    });
  }

  function appendStage(payload: SseStagePayload) {
    stageSeq += 1;
    stageEvents = [
      ...stageEvents,
      {
        id: stageSeq,
        rowId: payload.rowId,
        rowLabel: payload.rowLabel,
        stage: payload.stage,
        status: payload.status,
        at: payload.at,
        attempt: payload.attempt,
        latencyMs: payload.latencyMs,
        message: payload.message,
      },
    ];
  }

  function resetRunState() {
    error = "";
    validationError = "";
    cards = [];
    result = null;
    activities = [];
    progress = null;
    stageEvents = [];
    stageSeq = 0;
    status = "";
  }

  function newDigest() {
    resetRunState();
    running = false;
  }

  async function submit() {
    if (!config || running) return;
    const invalid = validateComposerInput(input, pdfs.length);
    if (invalid) {
      validationError = invalid;
      return;
    }

    running = true;
    validationError = "";
    error = "";
    cards = [];
    result = null;
    activities = [];
    progress = null;
    stageEvents = [];
    stageSeq = 0;
    status = "Starting digest…";

    const { urls, text } = splitComposerInput(input);
    const form = new FormData();
    form.set("urls", urls);
    form.set("text", text);
    form.set("model", modelId || config.defaultModel);
    for (const file of pdfs) form.append("pdfs", file);

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
      onStage: appendStage,
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
        error =
          cards.length > 0
            ? COPY.errors.partial(cards.length)
            : p.message || COPY.errors.run;
        progress = null;
        running = false;
      },
    });

    if (running) running = false;
  }

  function reloadPage() {
    window.location.reload();
  }
</script>

<div class="page" data-phase={phase}>
  {#if config}
    <Header deployUrl={config.deployUrl} signupUrl={config.signupNavbar} />

    <main class="main">
      <div class="content">
        {#if showEmptyState}
          <EmptyState />
          <DigestComposer
            bind:input
            bind:modelId
            bind:pdfs
            {models}
            {modelsLoading}
            {running}
            {validationError}
            prominent
            onSubmit={submit}
          />
          <TopicStarters onSelect={applySuggestion} />
          <StarterGallery onSelect={applySuggestion} />
        {/if}

        {#if showTimeline}
          <WorkflowTimeline
            events={stageEvents}
            active={running}
            headline={timelineHeadline}
          />
        {:else if showActivityFallback}
          <ActivityPanel {activities} {progress} headline={status} />
        {/if}

        {#if running && progress}
          <p class="run-progress" role="status" aria-live="polite">
            {progress.message}
            {#if cards.length}
              · {COPY.results.itemsStreaming(cards.length)}
            {/if}
          </p>
        {/if}

        {#if error}
          <AlertBanner
            message={error}
            tone="error"
            primaryLabel={COPY.app.retry}
            onPrimary={submit}
            secondaryLabel={phase === "error" && cards.length === 0
              ? COPY.app.reload
              : COPY.app.newDigest}
            onSecondary={phase === "error" && cards.length === 0
              ? reloadPage
              : newDigest}
          />
        {/if}

        {#if showResultsChrome}
          <ResultsHeader
            count={cards.length}
            streaming={running}
            onNewDigest={newDigest}
          />
        {/if}

        {#if result}
          <DigestSummary {result} />
        {/if}

        {#if cards.length}
          <div class="cards" aria-label="Digest items">
            {#each cards as card, i (i)}
              <DigestCard {card} />
            {/each}
          </div>
        {/if}
      </div>

      {#if !showEmptyState}
        <DigestComposer
          bind:input
          bind:modelId
          bind:pdfs
          {models}
          {modelsLoading}
          {running}
          {validationError}
          onSubmit={submit}
        />
      {/if}
    </main>

    <Footer githubRepo={config.githubRepo} />
  {:else if error}
    <main class="main main-centered">
      <AlertBanner
        message={error}
        tone="error"
        primaryLabel={COPY.app.reload}
        onPrimary={reloadPage}
      />
    </main>
  {:else}
    <main class="main main-centered">
      <p class="status" role="status">{COPY.app.loading}</p>
    </main>
  {/if}
</div>
