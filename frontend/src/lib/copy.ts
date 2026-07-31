/** User-facing copy for Read It For Me (single source of truth). */

export const COPY = {
  app: {
    title: "Read It For Me",
    subtitle: "Daily digest for links and docs",
    heading: "What do you want to catch up on?",
    intro: "Paste sources. See what to do first, then what can wait.",
    poweredByPrefix: "Powered by",
    poweredBySuffix: "on Render Workflows.",
    togetherAi: "Together AI",
    togetherAiUrl: "https://www.together.ai/",
    howItWorks: "How it works",
    githubLink: "GitHub repository",
    workflowsDocs: "Workflows docs",
    loading: "Loading…",
    newDigest: "New digest",
    retry: "Retry",
    reload: "Reload",
  },
  composer: {
    inputLabel: "Links and notes",
    inputHint: "One URL or text block per line. Press Cmd/Ctrl+Enter to build.",
    inputPlaceholder: "Paste URLs or text (one per line)…",
    modelLabel: "Together AI model",
    modelHint: "Search the chat model catalog.",
    modelPlaceholder: "Search models…",
    modelLoading: "Loading models…",
    modelEmpty: "No models match that search.",
    attachPdf: "Attach PDF",
    pdfsLabel: "PDFs",
    pdfsHint: "Optional. Up to 5 files.",
    removePdf: "Remove",
    pdfCount: (n: number) => (n === 1 ? "1 PDF attached" : `${n} PDFs attached`),
    submit: "Build digest",
    submitting: "Building…",
    emptyError: "Add at least one URL, text line, or PDF.",
  },
  phases: {
    empty: "Ready",
    running: "Running",
    partial: "Partial results",
    complete: "Complete",
    error: "Something went wrong",
  },
  results: {
    itemsReady: (n: number) => (n === 1 ? "1 item ready" : `${n} items ready`),
    itemsStreaming: (n: number) =>
      n === 1 ? "1 item analyzed so far" : `${n} items analyzed so far`,
    summaryTitle: "Start here",
    modelUsed: "Model",
    doToday: "Do today",
    readNow: "Read next",
    skip: "Skip for now",
    emptySection: "Nothing here.",
    whatToDo: "Do this",
    whyCare: "Why it matters",
    whatChanged: "What changed",
    verdictReason: "Why this call",
  },
  verdict: {
    read: "Read fully",
    skim: "Skim",
    skip: "Skip",
  },
  timeline: {
    title: "Execution timeline",
    hint: "Time flows left to right. Tap a stage for duration.",
    waiting: "Waiting for Workflow tasks…",
    live: "LIVE",
  },
  errors: {
    config: "Reload the page, then try again.",
    run: "Tap Retry to run the same input again.",
    partial: (done: number, total?: number) =>
      total
        ? `${done} of ${total} items finished before the run failed. Tap Retry.`
        : `${done} item(s) finished before the run failed. Tap Retry.`,
  },
  suggestions: [
    {
      label: "News",
      value:
        "https://www.technologyreview.com/feed/\nhttps://theconversation.com/us/articles.atom",
    },
    {
      label: "Ideas",
      value: "https://aeon.co/feed.rss\nhttps://theconversation.com/us/articles.atom",
    },
    {
      label: "Science",
      value:
        "https://www.nasa.gov/feed/\nhttps://www.smithsonianmag.com/rss/latest_articles/",
    },
    {
      label: "Culture",
      value: "https://lithub.com/feed/\nhttps://www.atlasobscura.com/feeds/latest",
    },
  ],
  collections: [
    {
      title: "Ideas & arguments",
      sources: ["Aeon", "The Conversation"],
      value: "https://aeon.co/feed.rss\nhttps://theconversation.com/us/articles.atom",
      art: "ideas",
    },
    {
      title: "Science & discovery",
      sources: ["NASA", "Smithsonian"],
      value:
        "https://www.nasa.gov/feed/\nhttps://www.smithsonianmag.com/rss/latest_articles/",
      art: "science",
    },
    {
      title: "Books & culture",
      sources: ["Literary Hub", "Atlas Obscura"],
      value: "https://lithub.com/feed/\nhttps://www.atlasobscura.com/feeds/latest",
      art: "culture",
    },
  ],
} as const;

export type Suggestion = (typeof COPY.suggestions)[number];
export type StarterCollection = (typeof COPY.collections)[number];

export function verdictLabel(worth: "read" | "skim" | "skip"): string {
  return COPY.verdict[worth];
}
