# Read It For Me

[![Read It For Me](static/images/screenshot.png)](https://read-it-for-me.onrender.com/)

Digest for links, pasted text, and PDFs. Each item answers what changed, why it matters, what to do, and whether it is worth reading fully.

[Live demo](https://read-it-for-me.onrender.com/) · [GitHub](https://github.com/render-examples/read-it-for-me-t)

<p align="left">
  <a href="https://render.com/deploy?repo=https://github.com/render-examples/read-it-for-me-t">
    <img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" height="28" />
  </a>
</p>

Built with [<img src="static/images/icons/svelte.svg" alt="" height="16" /> Svelte 5](https://svelte.dev/), [<img src="static/images/icons/express.svg" alt="" height="16" /> Express](https://expressjs.com/), [<img src="static/images/icons/render.svg" alt="" height="16" /> Render Workflows](https://render.com/docs/workflows), and [<img src="static/images/icons/postgresql.svg" alt="" height="16" /> Render Postgres](https://render.com/docs/postgresql).

Inference by [<img src="static/images/together-ai-logo.png" alt="" height="18" /> Together AI](https://www.together.ai/).

## Table of contents

- [Highlights](#highlights)
- [Overview](#overview)
- [Architecture](#architecture)
- [Usage](#usage)
- [Deploy on Render](#deploy-on-render)
- [Configuration](#configuration)
- [Operations](#operations)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Highlights

- **Action-first cards**: every item leads with `Do this`, then why it matters, what changed, and a `read` / `skim` / `skip` call. Summary lists cap at 5.
- **Together model picker**: searchable dropdown of Together chat models (live from `/v1/models`), passed into Workflow analyze/synthesize tasks.
- **Composer-first empty state**: topic chips and collection starters (news, ideas, science, culture) so a first run needs almost no typing.
- **Live progress** over Server-Sent Events while workflow tasks run on Render, with a detachable left-to-right Gantt timeline (`fetch` → `analyze` → `synthesize`).
- **Change tracking** via Postgres snapshots: repeat sources compare against the last digest.

## Overview

Read It For Me is for people who skim newsletters, release notes, and long threads and want a structured digest instead of a paragraph of fluff.

You submit URLs (one per line), pasted text blocks, optional PDFs, and a Together chat model from the searchable picker (default: `meta-llama/Llama-3.3-70B-Instruct-Turbo`). The Express server starts Render Workflow tasks, polls until each completes, and streams status, activity, stage timing, and per-item cards back to the browser. When all items are analyzed, a synthesis task produces a headline plus `doToday`, `readNow`, and `skip` lists.

The web service lists Together chat models via `GET /api/models` (needs `TOGETHER_API_KEY`). Inference still runs only inside Workflow tasks (`analyze_item`, `synthesize_digest`) using the selected model. Prior snapshots from Postgres feed into the analyze prompt so the model can comment on what changed since the last run.

**Current MVP gaps:** PDF uploads are accepted but text extraction is a placeholder. The workflow service is created manually in the Render Dashboard (not in `render.yaml`), matching the pattern used in other Render Workflows examples.

## Architecture

![Architecture diagram](static/images/architecture-diagram.png)

![Pipeline flow](static/images/pipeline-flow.png)

| Layer | Folder | Role |
|-------|--------|------|
| UI | `frontend/` | Svelte 5 composer, SSE client, digest cards, detachable timeline |
| API | `server/` | Express routes, orchestrator, Postgres, static SPA |
| Tasks | `workflow/` | `fetch_item`, `analyze_item`, `synthesize_digest` |
| Contracts | `shared/` | Types and Render URL helpers |

## Usage

### Web UI

1. Open the [live demo](https://read-it-for-me.onrender.com/) (or your deploy).
2. Pick a topic chip or collection, or paste URLs / text / PDFs.
3. Optionally search and pick a Together AI chat model (defaults to Llama 3.3 70B).
4. Click **Build digest**. Cards stream in as each item finishes; the summary panel loads at the end.
5. Use **New digest** to clear results and start again. Detach the execution timeline when you want a larger Gantt view.

### API (SSE)

`POST /api/digest` accepts `multipart/form-data`:

| Field | Type | Notes |
|-------|------|-------|
| `urls` | string | Newline-separated URLs (max 20 lines) |
| `text` | string | Newline-separated text blocks |
| `model` | string | Optional Together chat model id (defaults to `TOGETHER_MODEL`) |
| `pdfs` | file[] | Optional PDFs, max 5 files, 3 MB each |

Also: `GET /api/models` returns `{ models, defaultModel, source }` for the picker.

Response is `text/event-stream` with events: `status`, `activity`, `progress`, `stage`, `card`, `done`, `error`.

Requires `RENDER_API_KEY` and `DATABASE_URL` on the web service. Returns `503` if either is missing.

### Health

```bash
curl https://read-it-for-me.onrender.com/health
# {"ok":true}
```

### Tests

```bash
npm test
npm run build
```

## Deploy on Render

<p align="left">
  <a href="https://render.com/deploy?repo=https://github.com/render-examples/read-it-for-me-t">
    <img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" height="28" />
  </a>
</p>

Primary path: Blueprint for the web service and database, then a manual Workflow service.

### 1. Push to GitHub

This repo lives at [render-examples/read-it-for-me-t](https://github.com/render-examples/read-it-for-me-t). Fork or connect it if you are deploying your own copy.

### 2. Deploy the Blueprint

Use the **Deploy to Render** button in the app UI, or apply [`render.yaml`](render.yaml) from the Render Dashboard. This creates:

- **Web service** `read-it-for-me` — `node dist/server/index.js`, health check `/health`
- **Postgres** `read-it-for-me-db` — connection string wired to `DATABASE_URL`

Set `RENDER_API_KEY` and `TOGETHER_API_KEY` on the web service (Account Settings → API Keys for Render; Together dashboard for the model key).

### 3. Create the Workflow service

The Blueprint does not include the workflow runner. In the Dashboard:

1. **New → Workflow** (link the same repo).
2. **Build command:** `npm install && npm run build`
3. **Start command:** `node dist/workflow/index.js`
4. **Environment:**
   - `TOGETHER_API_KEY` — required
   - `DATABASE_URL` — same Postgres as the web service (internal URL on the private network)
   - `TOGETHER_MODEL` — optional, defaults to Llama 3.3 70B Instruct Turbo
5. Note the workflow **slug** (default expectation: `read-it-for-me-workflow`). Set `WORKFLOW_SLUG` on the web service if yours differs.

### 4. Verify

- `GET /health` returns `{"ok":true}`
- Submit a digest from the UI with at least one URL
- Check workflow task logs in the Render Dashboard if cards never appear

## Configuration

### Web service (`read-it-for-me`)

| Variable | Required | Default | If missing |
|----------|----------|---------|------------|
| `RENDER_API_KEY` | Yes (for digest) | — | `/api/digest` returns 503; `/health` still works |
| `TOGETHER_API_KEY` | Yes (for model list) | — | `/api/models` falls back to the default model only |
| `TOGETHER_MODEL` | No | `meta-llama/Llama-3.3-70B-Instruct-Turbo` | Picker default / form default |
| `DATABASE_URL` | Yes (for digest) | — | `/api/digest` returns 503; persistence disabled |
| `WORKFLOW_SLUG` | No | `read-it-for-me-workflow` | Task paths won't match your workflow |
| `GITHUB_REPO_URL` | No | `https://github.com/render-examples/read-it-for-me-t` | Deploy button points at default repo |
| `POLL_INTERVAL_MS` | No | `3000` | Task poll interval |
| `ENABLE_WORKFLOW_TIMELINE` | No | on (unset) | Set to `0` to hide the detachable Gantt and fall back to the activity log |
| `PORT` | No | `3000` | Set by Render in production |
| `NODE_ENV` | No | — | `production` enables Postgres SSL |

### Workflow service

| Variable | Required | Default | If missing |
|----------|----------|---------|------------|
| `TOGETHER_API_KEY` | Yes | — | `analyze_item` / `synthesize_digest` fail |
| `DATABASE_URL` | Recommended | — | Snapshots not written from workflow side (web service handles persistence) |
| `TOGETHER_MODEL` | No | `meta-llama/Llama-3.3-70B-Instruct-Turbo` | Falls back to default model |

## Operations

- **Health check:** `GET /health` — used by Render on the web service.
- **Logs:** Render Dashboard → service → Logs. Workflow task output appears on the Workflow service.
- **Database:** Tables `digest_runs`, `source_snapshots`, `digest_items` are created on web service startup when `DATABASE_URL` is set.
- **Ephemeral disk:** Uploaded PDFs are read in memory and deleted; do not rely on local filesystem persistence on Render.
- **Free tier:** Web services spin down after inactivity; first request after idle may be slow. Free Postgres expires after 30 days.

## Project structure

```
read-it-for-me/
├── frontend/src/
│   ├── App.svelte              # Phases, streaming, layout shell
│   ├── components/             # Composer, cards, empty state, chrome
│   ├── lib/                    # api, copy, phase, composer helpers
│   └── modules/
│       └── workflow-timeline/  # Detachable Gantt (delete folder + App import to remove)
├── server/
│   ├── index.ts                # Express entry, static files, config route
│   ├── routes/                 # health, digest
│   └── lib/                    # db, orchestrator, sse
├── workflow/
│   ├── index.ts                # Task registration
│   ├── tasks/                  # fetch, analyze, synthesize
│   └── lib/together.ts         # Together AI adapter
├── shared/                     # types.ts, renderUrls.ts
├── static/images/              # README screenshots and diagrams
├── render.yaml                 # Web + Postgres Blueprint
└── vite.config.ts              # Builds frontend → dist/client
```

**Where to change things**

- Digest prompts and LLM JSON shape: `workflow/tasks/analyze.ts`, `workflow/tasks/synthesize.ts`
- SSE event shape: `server/lib/orchestrator.ts`, `shared/types.ts`
- UI copy and phases: `frontend/src/lib/copy.ts`, `frontend/src/lib/phase.ts`
- UI layout and streaming client: `frontend/src/App.svelte`, `frontend/src/lib/api.ts`
- Postgres schema: `server/lib/db.ts`

## Troubleshooting

**`RENDER_API_KEY is not configured`**

Set the key on the web service. The server starts without it, but digest requests are blocked.

**`DATABASE_URL is not configured`**

Wire Postgres from the Blueprint on the web service. Digest requires persistence for snapshot diffs.

**Tasks fail immediately / wrong workflow**

Confirm `WORKFLOW_SLUG` on the web service matches the slug shown on your Workflow service in the Dashboard. Task names are `{slug}/fetch_item`, `{slug}/analyze_item`, `{slug}/synthesize_digest`.

**Together errors**

Check `TOGETHER_API_KEY` on the Workflow service and that the model name in `TOGETHER_MODEL` is available on your Together account.

**PDF content is generic**

Expected in MVP: `fetch_item` returns placeholder text for PDFs until real extraction is added.

**Stale UI after deploy**

Run `npm run build` before deploy. The web service serves `dist/client`; Vite dev server is not used in production.

## License

This project is licensed under the [MIT License](LICENSE).
