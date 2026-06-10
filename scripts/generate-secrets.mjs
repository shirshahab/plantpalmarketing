#!/usr/bin/env node
/**
 * Generate random secrets for Vercel production env.
 * Writes to .secrets.generated.txt (gitignored) — copy into Vercel env.
 */
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const cronSecret = randomBytes(32).toString("hex");
const authSecret = randomBytes(24).toString("base64url");
const outPath = join(process.cwd(), ".secrets.generated.txt");

const content = [
  "# PlantPal Marketing OS — production secrets (generated)",
  "# Copy into Vercel → Settings → Environment Variables → Production",
  "# Delete this file after copying. Never commit.",
  "",
  `CRON_SECRET=${cronSecret}`,
  `AUTH_SECRET=${authSecret}`,
  "APP_PASSWORD=<choose-your-own-strong-founder-password>",
  "",
].join("\n");

writeFileSync(outPath, content, "utf8");
console.log(`Secrets written to ${outPath}`);
console.log("Open the file, copy values into Vercel, then delete the file.");
