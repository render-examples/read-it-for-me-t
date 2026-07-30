<script lang="ts">
  /** Accessible digest composer: input, focus, PDFs, and submit. */
  import { COPY } from "../lib/copy";

  let {
    input = $bindable(""),
    focus = $bindable(""),
    pdfs = $bindable<File[]>([]),
    running = false,
    validationError = "",
    prominent = false,
    onSubmit,
  }: {
    input?: string;
    focus?: string;
    pdfs?: File[];
    running?: boolean;
    validationError?: string;
    prominent?: boolean;
    onSubmit: () => void;
  } = $props();

  let fileInput = $state<HTMLInputElement | null>(null);

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit();
    }
  }

  function onFileChange(e: Event) {
    const el = e.currentTarget as HTMLInputElement;
    const next = el.files ? Array.from(el.files) : [];
    pdfs = [...pdfs, ...next];
    el.value = "";
  }

  function removePdf(index: number) {
    pdfs = pdfs.filter((_, i) => i !== index);
  }

  function openFilePicker() {
    fileInput?.click();
  }
</script>

<form
  class="composer"
  class:composer-prominent={prominent}
  onsubmit={(e) => {
    e.preventDefault();
    onSubmit();
  }}
>
  <div class="composer-block">
    <label class="field-label" for="digest-input">{COPY.composer.inputLabel}</label>
    <p class="field-hint" id="digest-input-hint">{COPY.composer.inputHint}</p>
    <textarea
      id="digest-input"
      rows="4"
      bind:value={input}
      onkeydown={onKeydown}
      placeholder={COPY.composer.inputPlaceholder}
      disabled={running}
      aria-describedby={validationError
        ? "digest-input-hint digest-validation"
        : "digest-input-hint"}
      aria-invalid={validationError ? "true" : undefined}
    ></textarea>
  </div>

  <div class="composer-row">
    <div class="composer-focus">
      <label class="field-label" for="digest-focus">{COPY.composer.focusLabel}</label>
      <input
        id="digest-focus"
        type="text"
        class="focus-input"
        bind:value={focus}
        placeholder={COPY.composer.focusPlaceholder}
        disabled={running}
      />
    </div>

    <div class="composer-pdfs">
      <span class="field-label" id="pdf-label">{COPY.composer.pdfsLabel}</span>
      <input
        bind:this={fileInput}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        class="visually-hidden"
        disabled={running}
        aria-labelledby="pdf-label"
        onchange={onFileChange}
      />
      <button
        type="button"
        class="btn btn-ghost pdf-attach"
        disabled={running}
        onclick={openFilePicker}
      >
        {COPY.composer.attachPdf}
      </button>
      {#if pdfs.length}
        <ul class="pdf-list" aria-label={COPY.composer.pdfCount(pdfs.length)}>
          {#each pdfs as file, i}
            <li class="pdf-item">
              <span class="pdf-name" title={file.name}>{file.name}</span>
              <button
                type="button"
                class="pdf-remove"
                disabled={running}
                aria-label={`${COPY.composer.removePdf} ${file.name}`}
                onclick={() => removePdf(i)}
              >
                {COPY.composer.removePdf}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>

  {#if validationError}
    <p class="composer-error" id="digest-validation" role="alert">{validationError}</p>
  {/if}

  <div class="composer-actions">
    <button type="submit" class="btn btn-primary build-btn" disabled={running}>
      {running ? COPY.composer.submitting : COPY.composer.submit}
    </button>
  </div>
</form>
