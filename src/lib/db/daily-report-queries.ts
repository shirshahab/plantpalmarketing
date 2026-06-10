import { createServerClient } from "@/lib/supabase";
import { getCalendarHQStats, getCalendarTodayItems } from "@/lib/db/calendar-queries";
import { mapDailyReport, mapGrowthActionItem, mapWorkflowRun } from "@/lib/supabase/mappers";
import { isMissingTableError } from "@/lib/integrations/db-safe";

export async function getDailyReports(limit = 10) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("daily_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapDailyReport);
}

export async function getLatestDailyReport() {
  const reports = await getDailyReports(1);
  return reports[0] ?? null;
}

export async function getDailyReportById(id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("daily_reports").select("*").eq("id", id).single();
  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(error.message);
  }
  return mapDailyReport(data);
}

export async function getWorkflowRuns(limit = 20) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("workflow_runs")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapWorkflowRun);
}

export async function getGrowthActionItems(limit = 30) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("growth_action_items")
    .select("*")
    .order("impact_score", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapGrowthActionItem);
}

export async function getDailyReportPageData() {
  const [latestReport, reports, workflowRuns, actionItems, calendarStats, calendarToday] =
    await Promise.all([
      getLatestDailyReport(),
      getDailyReports(5),
      getWorkflowRuns(),
      getGrowthActionItems(),
      getCalendarHQStats(),
      getCalendarTodayItems(10),
    ]);
  return { latestReport, reports, workflowRuns, actionItems, calendarStats, calendarToday };
}
