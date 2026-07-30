/** Workflow entry: registers all Render Workflow tasks on start. */
export {};

// Side-effect imports: each task file calls `task(...)` so Render can discover them.
await import("./tasks/fetch.js");
await import("./tasks/analyze.js");
await import("./tasks/synthesize.js");
