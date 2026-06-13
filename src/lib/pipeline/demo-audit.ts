import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";

const DEMO_PATTERNS = [
  /\bdemo\b/i,
  /\bmock\b/i,
  /\bsample\b/i,
  /\btest\b/i,
  /\bplaceholder\b/i,
  /plantpanic2024/i,
  /garden_newbie_22/i,
];

function isDemoText(value: string): boolean {
  return DEMO_PATTERNS.some((p) => p.test(value));
}

function scanRows(rows: Record<string, unknown>[], fields: string[]): number {
  let count = 0;
  for (const row of rows) {
    const blob = fields.map((f) => String(row[f] ?? "")).join(" ");
    if (isDemoText(blob)) count += 1;
  }
  return count;
}

export interface DemoAuditResult {
  total: number;
  byTable: Record<string, number>;
  message: string;
}

export async function auditDemoContent(): Promise<DemoAuditResult> {
  const supabase = createServerClient();
  const tables: { table: string; fields: string[] }[] = [
    { table: "intelligence_alerts", fields: ["title", "body", "author"] },
    { table: "approval_queue", fields: ["draft", "channel"] },
    { table: "image_prompts", fields: ["title", "prompt"] },
    { table: "video_generation_queue", fields: ["title", "concept"] },
    { table: "seo_blog_posts", fields: ["headline", "keyword"] },
    { table: "content_pipeline", fields: ["title", "body"] },
  ];

  const byTable: Record<string, number> = {};
  let total = 0;

  for (const { table, fields } of tables) {
    const { data, error } = await supabase.from(table).select(fields.join(",")).limit(500);
    if (error) {
      if (isMissingTableError(error)) {
        byTable[table] = 0;
        continue;
      }
      byTable[table] = 0;
      continue;
    }
    const found = scanRows((data ?? []) as Record<string, unknown>[], fields);
    byTable[table] = found;
    total += found;
  }

  return {
    total,
    byTable,
    message: total === 0 ? "No demo/mock rows detected" : `${total} demo/mock rows found across HQ tables`,
  };
}

export async function deleteOrRejectDemoRows(): Promise<{ deleted: number; rejected: number; errors: string[] }> {
  const supabase = createServerClient();
  let deleted = 0;
  let rejected = 0;
  const errors: string[] = [];

  const rejectTables = ["image_prompts", "video_generation_queue"] as const;
  for (const table of rejectTables) {
    const { data, error } = await supabase.from(table).select("*").neq("status", "rejected").limit(500);
    if (error) {
      if (!isMissingTableError(error)) errors.push(`${table}: ${error.message}`);
      continue;
    }
    for (const row of data ?? []) {
      const r = row as Record<string, unknown>;
      const blob = `${r.title ?? ""} ${r.concept ?? ""} ${r.prompt ?? ""}`;
      if (!isDemoText(blob)) continue;
      const meta = (r.metadata && typeof r.metadata === "object" ? r.metadata : {}) as Record<string, unknown>;
      const { error: upErr } = await supabase
        .from(table)
        .update({
          status: "rejected",
          metadata: { ...meta, rejected_reason: "Demo/mock content removed from production" },
          updated_at: new Date().toISOString(),
        })
        .eq("id", String(r.id));
      if (upErr) errors.push(`${table} ${r.id}: ${upErr.message}`);
      else rejected += 1;
    }
  }

  const deleteTables = ["approval_queue", "creative_content_ideas"] as const;
  for (const table of deleteTables) {
    const { data, error } = await supabase.from(table).select("*").limit(500);
    if (error) {
      if (!isMissingTableError(error)) errors.push(`${table}: ${error.message}`);
      continue;
    }
    for (const row of data ?? []) {
      const r = row as Record<string, unknown>;
      const blob = `${r.title ?? ""} ${r.draft ?? ""} ${r.body ?? ""} ${r.hook ?? ""}`;
      if (!isDemoText(blob)) continue;
      const { error: delErr } = await supabase.from(table).delete().eq("id", String(r.id));
      if (delErr) errors.push(`${table} ${r.id}: ${delErr.message}`);
      else deleted += 1;
    }
  }

  return { deleted, rejected, errors };
}
