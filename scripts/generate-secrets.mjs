#!/usr/bin/env node
/**
 * Generate random secrets for Vercel production env.
 * Copy output into Vercel → Settings → Environment Variables
 */
import { randomBytes } from "node:crypto";

const cronSecret = randomBytes(32).toString("hex");
const authSecret = randomBytes(24).toString("base64url");

console.log("PlantPal Marketing OS — suggested production secrets\n");
console.log("CRON_SECRET=" + cronSecret);
console.log("AUTH_SECRET=" + authSecret);
console.log("\nAPP_PASSWORD= choose your own strong founder password (do not auto-generate in logs)");
console.log("\nAdd these in Vercel → Project → Settings → Environment Variables → Production");
