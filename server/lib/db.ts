/** Postgres persistence for digest runs and per-source change snapshots. */
import pg from "pg";
import type { DigestSummary, ItemAnalysis } from "../../shared/types.js";

const pool = process.env.DATABASE_URL
  ? new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
    })
  : null;

/** Create digest tables if they do not exist. No-op when DATABASE_URL is unset. */
export async function initDb(): Promise<void> {
  if (!pool) {
    console.warn("DATABASE_URL not set — persistence disabled");
    return;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS digest_runs (
      id SERIAL PRIMARY KEY,
      focus TEXT NOT NULL DEFAULT '',
      summary JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS source_snapshots (
      id SERIAL PRIMARY KEY,
      source_key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL DEFAULT '',
      content_hash TEXT NOT NULL,
      summary JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS digest_items (
      id SERIAL PRIMARY KEY,
      run_id INTEGER NOT NULL REFERENCES digest_runs(id) ON DELETE CASCADE,
      source_key TEXT NOT NULL,
      analysis JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

/** Insert a digest_runs row; returns 0 when persistence is disabled. */
export async function createRun(focus: string): Promise<number> {
  if (!pool) return 0;
  const { rows } = await pool.query(
    `INSERT INTO digest_runs (focus) VALUES ($1) RETURNING id`,
    [focus]
  );
  return rows[0].id as number;
}

/** Prior analysis + content hash for change detection across digests. */
export async function getPriorSnapshot(sourceKey: string): Promise<{
  title: string;
  contentHash: string;
  summary: ItemAnalysis;
} | null> {
  if (!pool) return null;
  const { rows } = await pool.query(
    `SELECT title, content_hash, summary FROM source_snapshots WHERE source_key = $1`,
    [sourceKey]
  );
  if (!rows.length) return null;
  const row = rows[0];
  return {
    title: row.title,
    contentHash: row.content_hash,
    summary: row.summary as ItemAnalysis,
  };
}

/** Persist summary, per-item analyses, and upsert source snapshots. */
export async function saveRun(
  runId: number,
  items: ItemAnalysis[],
  sourceKeys: string[],
  contentHashes: string[],
  summary: DigestSummary
): Promise<void> {
  if (!pool || !runId) return;

  await pool.query(`UPDATE digest_runs SET summary = $2 WHERE id = $1`, [
    runId,
    summary,
  ]);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const sourceKey = sourceKeys[i];
    const hash = contentHashes[i];
    await pool.query(
      `INSERT INTO digest_items (run_id, source_key, analysis) VALUES ($1, $2, $3)`,
      [runId, sourceKey, item]
    );
    await pool.query(
      `INSERT INTO source_snapshots (source_key, title, content_hash, summary, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (source_key) DO UPDATE SET
         title = EXCLUDED.title,
         content_hash = EXCLUDED.content_hash,
         summary = EXCLUDED.summary,
         updated_at = now()`,
      [sourceKey, item.title, hash, item]
    );
  }
}

/** True when DATABASE_URL is set and the pool was created. */
export function dbReady(): boolean {
  return pool !== null;
}
