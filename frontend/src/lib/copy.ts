/** User-facing copy for Read It For Me (single source of truth). */

export const COPY = {
  app: {
    title: "Read It For Me",
    subtitle: "Daily digest for links and docs",
    heading: "What do you want to catch up on?",
    intro:
      "Add links, notes, or PDFs. Get one digest of what matters and what can wait.",
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
    focusLabel: "Focus this week",
    focusPlaceholder: "Optional theme, for example AI infra",
    attachPdf: "Attach PDF",
    pdfsLabel: "PDFs",
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
    summaryTitle: "Digest summary",
    doToday: "Do today",
    readNow: "Read now",
    skip: "Skip",
    emptySection: "Nothing in this list.",
    whatChanged: "What changed",
    whyCare: "Why care",
    whatToDo: "What to do",
    verdictReason: "Why this verdict",
  },
  verdict: {
    read: "Read fully",
    skim: "Skim",
    skip: "Skip",
  },
  timeline: {
    title: "Execution timeline",
    hint: "Time flows left to right. Tap or hover a stage for duration.",
    waiting: "Waiting for Workflow tasks…",
    live: "LIVE",
  },
  errors: {
    config: "Could not load app config. Check your connection and reload.",
    run: "The digest run failed. You can retry with the same input.",
    partial: (done: number, total?: number) =>
      total
        ? `${done} of ${total} items completed before the run failed.`
        : `${done} item(s) completed before the run failed.`,
  },
  suggestions: [
    {
      label: "News",
      value:
        "https://www.technologyreview.com/feed/\nhttps://theconversation.com/us/articles.atom",
      focus: "the developments with the broadest consequences",
    },
    {
      label: "Ideas",
      value: "https://aeon.co/feed.rss\nhttps://theconversation.com/us/articles.atom",
      focus: "ideas worth returning to",
    },
    {
      label: "Science",
      value:
        "https://www.nasa.gov/feed/\nhttps://www.smithsonianmag.com/rss/latest_articles/",
      focus: "surprising discoveries and why they matter",
    },
    {
      label: "Culture",
      value: "https://lithub.com/feed/\nhttps://www.atlasobscura.com/feeds/latest",
      focus: "books, places, history, and culture",
    },
  ],
  collections: [
    {
      title: "Ideas & arguments",
      sources: ["Aeon", "The Conversation"],
      value: "https://aeon.co/feed.rss\nhttps://theconversation.com/us/articles.atom",
      focus: "the strongest ideas and disagreements",
      art: "ideas",
    },
    {
      title: "Science & discovery",
      sources: ["NASA", "Smithsonian"],
      value:
        "https://www.nasa.gov/feed/\nhttps://www.smithsonianmag.com/rss/latest_articles/",
      focus: "discoveries that change how we understand the world",
      art: "science",
    },
    {
      title: "Books & culture",
      sources: ["Literary Hub", "Atlas Obscura"],
      value: "https://lithub.com/feed/\nhttps://www.atlasobscura.com/feeds/latest",
      focus: "books, places, history, and culture",
      art: "culture",
    },
  ],
} as const;

export type Suggestion = (typeof COPY.suggestions)[number];
export type StarterCollection = (typeof COPY.collections)[number];

export function verdictLabel(worth: "read" | "skim" | "skip"): string {
  return COPY.verdict[worth];
}
