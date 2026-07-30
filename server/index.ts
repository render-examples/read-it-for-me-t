/** Express entry: serves the Svelte SPA, config API, health check, and digest routes. */
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { deployToRenderUrl, renderSignupUrlWithUtms } from "../shared/renderUrls.js";
import { initDb } from "./lib/db.js";
import { digestRouter } from "./routes/digest.js";
import { healthRouter } from "./routes/health.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..", "..");
const PORT = parseInt(process.env.PORT || "3000", 10);
const GITHUB_REPO =
  process.env.GITHUB_REPO_URL || "https://github.com/ojusave/read-it-for-me";

const app = express();
app.use(express.json({ limit: "512kb" }));

app.use(healthRouter);
app.use("/api", digestRouter);

app.get("/api/config", (_req, res) => {
  res.json({
    githubRepo: GITHUB_REPO,
    deployUrl: deployToRenderUrl(GITHUB_REPO),
    signupNavbar: renderSignupUrlWithUtms("navbar_button"),
  });
});

const clientDir = path.join(repoRoot, "dist", "client");
app.use(express.static(clientDir));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

initDb()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Read It For Me listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database init failed:", err);
    process.exit(1);
  });
