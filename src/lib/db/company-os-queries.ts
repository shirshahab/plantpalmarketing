import { createServerClient } from "@/lib/supabase/server";
import {
  getCompanyOperatingSummary,
  WORKFLOW_PIPELINES,
  type CompanyOperatingSummary,
  type CompanyWorkflowType,
} from "@/lib/company-os/company-os";

export interface CompanyWorkflowRow {
  id: string;
  workflowType: string;
  workflowName: string;
  status: string;
  priority: string;
  sourceAgent: string;
  currentAgent: string;
  nextAgent: string;
  startedAt: string;
  completedAt: string | null;
  blockedAt: string | null;
  blockerReason: string;
  outcome: string;
  impactScore: number;
  steps: WorkflowStepRow[];
}

export interface WorkflowStepRow {
  id: string;
  stepOrder: number;
  stepName: string;
  agentId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  inputSummary: string;
  outputSummary: string;
  blockerReason: string;
}

export interface CompanyOutputRow {
  id: string;
  workflowId: string | null;
  agentId: string;
  outputType: string;
  title: string;
  summary: string;
  status: string;
  riskLevel: string;
  approvalRequired: boolean;
  publishedUrl: string;
  createdAt: string;
}

export interface CompanyDecisionRow {
  id: string;
  workflowId: string | null;
  decisionType: string;
  decisionMaker: string;
  decision: string;
  reason: string;
  feedback: string;
  impactScore: number;
  createdAt: string;
}

export interface CompanyBottleneckRow {
  id: string;
  workflowId: string | null;
  agentId: string;
  bottleneckType: string;
  description: string;
  severity: string;
  recommendedFix: string;
  status: string;
  createdAt: string;
}

export interface HandoffRow {
  fromAgent: string;
  toAgent: string;
  title: string;
  createdAt: string;
}

export interface WorkflowMapEntry {
  workflowType: string;
  pipeline: string[];
  active: number;
  completed: number;
  blocked: number;
}

export interface CompanyOsPageData {
  tablesMissing: boolean;
  summary: CompanyOperatingSummary;
  activeWorkflows: CompanyWorkflowRow[];
  completedWorkflows: CompanyWorkflowRow[];
  blockedWorkflows: CompanyWorkflowRow[];
  outputs: CompanyOutputRow[];
  decisions: CompanyDecisionRow[];
  bottlenecks: CompanyBottleneckRow[];
  handoffs: HandoffRow[];
  workflowMap: WorkflowMapEntry[];
}

export async function getCompanyOsPageData(): Promise<CompanyOsPageData> {
  const supabase = createServerClient();

  const empty: CompanyOsPageData = {
    tablesMissing: false,
    summary: await getCompanyOperatingSummary(),
    activeWorkflows: [],
    completedWorkflows: [],
    blockedWorkflows: [],
    outputs: [],
    decisions: [],
    bottlenecks: [],
    handoffs: [],
    workflowMap: [],
  };

  try {
    const [workflowsRes, outputsRes, decisionsRes, bottlenecksRes, handoffsRes] = await Promise.all([
      supabase.from("company_workflows").select("*").order("updated_at", { ascending: false }).limit(120),
      supabase.from("company_outputs").select("*").order("created_at", { ascending: false }).limit(40),
      supabase.from("company_decisions").select("*").order("created_at", { ascending: false }).limit(40),
      supabase.from("company_bottlenecks").select("*").order("created_at", { ascending: false }).limit(30),
      supabase
        .from("agent_messages")
        .select("from_agent, to_agent, title, created_at")
        .eq("message_type", "handoff")
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

    if (workflowsRes.error) {
      return { ...empty, tablesMissing: true };
    }

    const workflows = workflowsRes.data ?? [];
    const workflowIds = workflows.map((w) => w.id);

    let stepsByWorkflow = new Map<string, WorkflowStepRow[]>();
    if (workflowIds.length > 0) {
      const { data: steps } = await supabase
        .from("workflow_steps")
        .select("*")
        .in("workflow_id", workflowIds)
        .order("step_order", { ascending: true });
      stepsByWorkflow = new Map();
      for (const s of steps ?? []) {
        const list = stepsByWorkflow.get(s.workflow_id) ?? [];
        list.push({
          id: s.id,
          stepOrder: s.step_order,
          stepName: s.step_name,
          agentId: s.agent_id,
          status: s.status,
          startedAt: s.started_at,
          completedAt: s.completed_at,
          inputSummary: s.input_summary,
          outputSummary: s.output_summary,
          blockerReason: s.blocker_reason,
        });
        stepsByWorkflow.set(s.workflow_id, list);
      }
    }

    const mapRow = (w: (typeof workflows)[number]): CompanyWorkflowRow => ({
      id: w.id,
      workflowType: w.workflow_type,
      workflowName: w.workflow_name,
      status: w.status,
      priority: w.priority,
      sourceAgent: w.source_agent,
      currentAgent: w.current_agent,
      nextAgent: w.next_agent,
      startedAt: w.started_at,
      completedAt: w.completed_at,
      blockedAt: w.blocked_at,
      blockerReason: w.blocker_reason,
      outcome: w.outcome,
      impactScore: w.impact_score,
      steps: stepsByWorkflow.get(w.id) ?? [],
    });

    const all = workflows.map(mapRow);

    // Workflow map — counts per pipeline type
    const workflowMap: WorkflowMapEntry[] = (
      Object.entries(WORKFLOW_PIPELINES) as [CompanyWorkflowType, string[]][]
    ).map(([type, pipeline]) => ({
      workflowType: type,
      pipeline,
      active: all.filter((w) => w.workflowType === type && w.status === "active").length,
      completed: all.filter((w) => w.workflowType === type && w.status === "completed").length,
      blocked: all.filter((w) => w.workflowType === type && w.status === "blocked").length,
    }));

    return {
      tablesMissing: false,
      summary: empty.summary,
      activeWorkflows: all.filter((w) => w.status === "active").slice(0, 30),
      completedWorkflows: all.filter((w) => w.status === "completed").slice(0, 30),
      blockedWorkflows: all.filter((w) => w.status === "blocked").slice(0, 30),
      outputs: (outputsRes.data ?? []).map((o) => ({
        id: o.id,
        workflowId: o.workflow_id,
        agentId: o.agent_id,
        outputType: o.output_type,
        title: o.title,
        summary: o.summary,
        status: o.status,
        riskLevel: o.risk_level,
        approvalRequired: o.approval_required,
        publishedUrl: o.published_url,
        createdAt: o.created_at,
      })),
      decisions: (decisionsRes.data ?? []).map((d) => ({
        id: d.id,
        workflowId: d.workflow_id,
        decisionType: d.decision_type,
        decisionMaker: d.decision_maker,
        decision: d.decision,
        reason: d.reason,
        feedback: d.feedback,
        impactScore: d.impact_score,
        createdAt: d.created_at,
      })),
      bottlenecks: (bottlenecksRes.data ?? []).map((b) => ({
        id: b.id,
        workflowId: b.workflow_id,
        agentId: b.agent_id,
        bottleneckType: b.bottleneck_type,
        description: b.description,
        severity: b.severity,
        recommendedFix: b.recommended_fix,
        status: b.status,
        createdAt: b.created_at,
      })),
      handoffs: (handoffsRes.data ?? []).map((h) => ({
        fromAgent: h.from_agent,
        toAgent: h.to_agent,
        title: h.title,
        createdAt: h.created_at,
      })),
      workflowMap,
    };
  } catch {
    return { ...empty, tablesMissing: true };
  }
}
