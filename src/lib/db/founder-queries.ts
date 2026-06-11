import { createServerClient } from "@/lib/supabase";
import { mapAgentHealth } from "@/lib/supabase/mappers";
import { getCompanyOperatingSummary, type CompanyOperatingSummary } from "@/lib/company-os/company-os";

export interface FounderListItem {
  id: string;
  title: string;
  detail: string;
  href: string;
}

export interface FounderModeData {
  executiveSummary: string;
  approvalsNeeded: { count: number; items: FounderListItem[] };
  readyToPublish: { count: number; items: FounderListItem[] };
  urgentIssues: FounderListItem[];
  competitorAlerts: FounderListItem[];
  creatorOpportunities: FounderListItem[];
  pipeline: { label: string; count: number }[];
  agentHealth: { agentId: string; status: string; lastError: string }[];
  recommendedActions: FounderListItem[];
  companyOs: CompanyOperatingSummary;
}

type AnyClient = ReturnType<typeof createServerClient>;

async function safely<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

async function getExecutiveSummary(supabase: AnyClient): Promise<string> {
  return safely("No brief generated yet. Run Ivy from the schedules page and she'll write one.", async () => {
    const { data } = await supabase
      .from("ivy_briefs")
      .select("executive_summary, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.executive_summary) return data.executive_summary;
    const { data: report } = await supabase
      .from("daily_reports")
      .select("summary")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return report?.summary || "No brief generated yet. Run Ivy from the schedules page and she'll write one.";
  });
}

export async function getFounderModeData(): Promise<FounderModeData> {
  const supabase = createServerClient();

  const [
    executiveSummary,
    approvalsNeeded,
    readyToPublish,
    urgentIssues,
    competitorAlerts,
    creatorOpportunities,
    pipeline,
    agentHealth,
    recommendedActions,
  ] = await Promise.all([
    getExecutiveSummary(supabase),

    safely({ count: 0, items: [] as FounderListItem[] }, async () => {
      const { data, count } = await supabase
        .from("approval_queue")
        .select("id, type, channel, draft", { count: "exact" })
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      return {
        count: count ?? 0,
        items: (data ?? []).map((a) => ({
          id: a.id,
          title: `${a.type}${a.channel ? ` — ${a.channel}` : ""}`,
          detail: (a.draft ?? "").slice(0, 110),
          href: "/approvals",
        })),
      };
    }),

    safely({ count: 0, items: [] as FounderListItem[] }, async () => {
      const { data, count } = await supabase
        .from("content_calendar")
        .select("id, title, platform", { count: "exact" })
        .eq("status", "ready_to_publish")
        .order("updated_at", { ascending: false })
        .limit(5);
      return {
        count: count ?? 0,
        items: (data ?? []).map((c) => ({
          id: c.id,
          title: c.title,
          detail: c.platform,
          href: "/calendar",
        })),
      };
    }),

    safely([] as FounderListItem[], async () => {
      const issues: FounderListItem[] = [];
      const { data: alerts } = await supabase
        .from("ivy_alerts")
        .select("id, title, alert_type, priority_score")
        .gte("priority_score", 70)
        .order("priority_score", { ascending: false })
        .limit(4);
      for (const a of alerts ?? []) {
        issues.push({ id: a.id, title: a.title, detail: `${a.alert_type} · priority ${a.priority_score}`, href: "/ivy" });
      }
      const { data: failed } = await supabase
        .from("agent_health")
        .select("agent_id, status, last_error_message")
        .in("status", ["failed", "degraded"]);
      for (const f of failed ?? []) {
        issues.push({
          id: `health-${f.agent_id}`,
          title: `${f.agent_id} is ${f.status}`,
          detail: (f.last_error_message ?? "").slice(0, 110),
          href: "/automation/schedules",
        });
      }
      return issues.slice(0, 6);
    }),

    safely([] as FounderListItem[], async () => {
      const { data } = await supabase
        .from("competitor_alerts")
        .select("id, title, competitor")
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []).map((a) => ({ id: a.id, title: a.title, detail: a.competitor, href: "/competitors" }));
    }),

    safely([] as FounderListItem[], async () => {
      const { data } = await supabase
        .from("creator_leads")
        .select("id, handle, priority, partnership_score")
        .eq("priority", "high")
        .order("partnership_score", { ascending: false })
        .limit(5);
      return (data ?? []).map((l) => ({
        id: l.id,
        title: `@${l.handle}`,
        detail: `Partnership score ${l.partnership_score}`,
        href: "/creators",
      }));
    }),

    safely([] as { label: string; count: number }[], async () => {
      const statuses = ["draft", "sage_review", "gate_review", "approved", "scheduled", "ready_to_publish", "published"];
      const counts = await Promise.all(
        statuses.map(async (s) => {
          const { count } = await supabase
            .from("content_calendar")
            .select("*", { count: "exact", head: true })
            .eq("status", s);
          return { label: s.replace(/_/g, " "), count: count ?? 0 };
        })
      );
      return counts;
    }),

    safely([] as { agentId: string; status: string; lastError: string }[], async () => {
      const { data } = await supabase.from("agent_health").select("*");
      return (data ?? [])
        .map(mapAgentHealth)
        .map((h) => ({ agentId: h.agentId, status: h.status, lastError: h.lastErrorMessage }))
        .sort((a, b) => a.agentId.localeCompare(b.agentId));
    }),

    safely([] as FounderListItem[], async () => {
      const { data } = await supabase
        .from("ivy_recommendations")
        .select("id, title, description, priority_score")
        .order("priority_score", { ascending: false })
        .limit(5);
      return (data ?? []).map((r) => ({ id: r.id, title: r.title, detail: r.description.slice(0, 110), href: "/ivy" }));
    }),
  ]);

  // Phase 31A — Company OS is the main source of truth for the founder
  const companyOs = await getCompanyOperatingSummary();

  return {
    executiveSummary,
    approvalsNeeded,
    readyToPublish,
    urgentIssues,
    competitorAlerts,
    creatorOpportunities,
    pipeline,
    agentHealth,
    recommendedActions,
    companyOs,
  };
}
