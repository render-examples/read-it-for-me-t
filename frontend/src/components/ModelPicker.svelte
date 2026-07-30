<script lang="ts">
  /** Searchable combobox for Together AI chat models. */
  import type { TogetherChatModel } from "../lib/api";
  import { COPY } from "../lib/copy";

  let {
    models = [],
    modelId = $bindable(""),
    disabled = false,
    loading = false,
  }: {
    models?: TogetherChatModel[];
    modelId?: string;
    disabled?: boolean;
    loading?: boolean;
  } = $props();

  let open = $state(false);
  let query = $state("");
  let listEl = $state<HTMLUListElement | null>(null);
  let activeIndex = $state(-1);

  const selected = $derived(models.find((m) => m.id === modelId) ?? null);

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.displayName.toLowerCase().includes(q) ||
        m.organization.toLowerCase().includes(q)
    );
  });

  function select(m: TogetherChatModel) {
    modelId = m.id;
    query = "";
    open = false;
    activeIndex = -1;
  }

  function onFocus() {
    open = true;
    activeIndex = models.findIndex((m) => m.id === modelId);
  }

  function onBlur(e: FocusEvent) {
    const next = e.relatedTarget as Node | null;
    if (listEl?.contains(next)) return;
    open = false;
    query = "";
    activeIndex = -1;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      open = false;
      query = "";
      activeIndex = -1;
      (e.currentTarget as HTMLElement).blur();
      return;
    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      open = true;
      const direction = e.key === "ArrowDown" ? 1 : -1;
      const next =
        activeIndex < 0
          ? direction > 0
            ? 0
            : filtered.length - 1
          : (activeIndex + direction + filtered.length) % filtered.length;
      activeIndex = filtered.length ? next : -1;
      scrollActiveOptionIntoView();
      return;
    }

    if (e.key === "Enter" && open) {
      e.preventDefault();
      if (activeIndex >= 0 && filtered[activeIndex]) {
        select(filtered[activeIndex]);
      }
    }
  }

  function optionId(index: number): string {
    return `model-option-${index}`;
  }

  function scrollActiveOptionIntoView() {
    requestAnimationFrame(() => {
      if (activeIndex < 0) return;
      listEl
        ?.querySelector<HTMLElement>(`#${optionId(activeIndex)}`)
        ?.scrollIntoView({ block: "nearest" });
    });
  }
</script>

<div class="model-picker">
  <label class="field-label" for="model-search">{COPY.composer.modelLabel}</label>
  <p class="field-hint" id="model-hint">{COPY.composer.modelHint}</p>

  <div class="model-combobox">
    <input
      id="model-search"
      type="text"
      class="model-search"
      role="combobox"
      aria-expanded={open}
      aria-controls="model-list"
      aria-autocomplete="list"
      aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
      aria-describedby="model-hint"
      disabled={disabled || loading}
      placeholder={loading
        ? COPY.composer.modelLoading
        : selected?.displayName || COPY.composer.modelPlaceholder}
      value={open ? query : selected?.displayName || modelId}
      onfocus={onFocus}
      onblur={onBlur}
      onkeydown={onKeydown}
      oninput={(e) => {
        query = (e.currentTarget as HTMLInputElement).value;
        open = true;
        activeIndex = -1;
      }}
    />

    {#if open && !disabled && !loading}
      <ul
        id="model-list"
        class="model-list"
        role="listbox"
        bind:this={listEl}
      >
        {#if filtered.length === 0}
          <li class="model-empty" role="presentation">{COPY.composer.modelEmpty}</li>
        {:else}
          {#each filtered as m (m.id)}
            {@const index = filtered.indexOf(m)}
            <li
              id={optionId(index)}
              class="model-option"
              class:active={index === activeIndex}
              class:selected={m.id === modelId}
              role="option"
              aria-selected={m.id === modelId}
              onmousedown={(e) => {
                e.preventDefault();
                select(m);
              }}
              onmousemove={() => (activeIndex = index)}
            >
                <span class="model-option-name">{m.displayName}</span>
                <span class="model-option-id">{m.id}</span>
            </li>
          {/each}
        {/if}
      </ul>
    {/if}
  </div>

  {#if selected}
    <p class="model-selected-id">{selected.id}</p>
  {/if}
</div>
