/** GET /api/models: searchable Together AI chat model catalog. */
import { Router } from "express";
import { listChatModels } from "../lib/together-models.js";

export const modelsRouter = Router();

modelsRouter.get("/models", async (_req, res) => {
  try {
    const payload = await listChatModels();
    res.json(payload);
  } catch (err) {
    console.error("GET /api/models failed", err);
    res.status(502).json({ error: "Could not load Together AI models" });
  }
});
