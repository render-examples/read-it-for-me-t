/** POST /api/digest: multipart input, SSE output. */
import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DigestItemInput } from "../../shared/types.js";
import { dbReady } from "../lib/db.js";
import { runDigest } from "../lib/orchestrator.js";
import { streamSse } from "../lib/sse.js";
import {
  defaultTogetherModel,
  isPlausibleModelId,
} from "../lib/together-models.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "..", ".uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 3 * 1024 * 1024 },
});

export const digestRouter = Router();

digestRouter.post("/digest", upload.array("pdfs", 5), async (req, res) => {
  if (!process.env.RENDER_API_KEY?.trim()) {
    res.status(503).json({ error: "RENDER_API_KEY is not configured" });
    return;
  }
  if (!dbReady()) {
    res.status(503).json({ error: "DATABASE_URL is not configured" });
    return;
  }

  const urls = parseLines(req.body.urls);
  const textBlocks = parseLines(req.body.text);
  const rawModel =
    typeof req.body.model === "string" ? req.body.model.trim() : "";
  const model =
    rawModel && isPlausibleModelId(rawModel)
      ? rawModel
      : defaultTogetherModel();

  const items: DigestItemInput[] = [
    ...urls.map((value) => ({ kind: "url" as const, value })),
    ...textBlocks.map((value) => ({ kind: "text" as const, value })),
  ];

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  for (const file of files) {
    const buf = fs.readFileSync(file.path);
    fs.unlinkSync(file.path); // Ephemeral upload dir; do not persist on Render disk.
    items.push({
      kind: "pdf",
      filename: file.originalname || "document.pdf",
      base64: buf.toString("base64"),
    });
  }

  if (!items.length) {
    res.status(400).json({ error: "Add at least one URL, text block, or PDF" });
    return;
  }

  await streamSse(res, runDigest(items, model));
});

function parseLines(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20);
}
