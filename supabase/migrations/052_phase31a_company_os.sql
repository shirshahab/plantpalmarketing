-- PlantPal Marketing OS — Phase 31A: Company Operating System Layer
-- Safe to re-run. Sits ABOVE existing tables — nothing is deleted or altered.
--
-- One source of truth for: what happened, who did it, what it created,
-- where it went next, whether it succeeded, what is blocked, and what
-- needs founder approval.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- company_workflows — every pipeline run across all agents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type TEXT NOT NULL DEFAULT 'content_creation',
  workflow_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  priority TEXT NOT NULL DEFAULT 'medium',
  source_agent TEXT NOT NULL DEFAULT '',
  current_agent TEXT NOT NULL DEFAULT '',
  next_agent TEXT NOT NULL DEFAULT '',
  trigger_id TEXT NOT NULL DEFAULT '',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  blocked_at TIMESTAMPTZ,
  blocker_reason TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT '',
  impact_score INTEGER NOT NULL DEFAULT 50,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.company_workflows ADD COLUMN IF NOT EXISTS trigger_id TEXT NOT NULL DEFAULT '';

ALTER TABLE public.company_workflows DROP CONSTRAINT IF EXISTS company_workflows_status_check;
ALTER TABLE public.company_workflows
  ADD CONSTRAINT company_workflows_status_check
  CHECK (status IN ('active', 'blocked', 'completed', 'failed', 'cancelled'));

ALTER TABLE public.company_workflows DROP CONSTRAINT IF EXISTS company_workflows_type_check;
ALTER TABLE public.company_workflows
  ADD CONSTRAINT company_workflows_type_check
  CHECK (workflow_type IN (
    'creator_partnership', 'community_response', 'content_creation', 'creative_asset',
    'publishing', 'seo_blog', 'reddit_reply', 'competitor_response',
    'growth_experiment', 'daily_report', 'system_health'
  ));

CREATE INDEX IF NOT EXISTS idx_company_workflows_status ON public.company_workflows(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_workflows_type ON public.company_workflows(workflow_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_workflows_trigger ON public.company_workflows(workflow_type, trigger_id);

DROP TRIGGER IF EXISTS company_workflows_updated_at ON public.company_workflows;
CREATE TRIGGER company_workflows_updated_at
  BEFORE UPDATE ON public.company_workflows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- workflow_steps — ordered timeline inside each workflow
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 1,
  step_name TEXT NOT NULL DEFAULT '',
  agent_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  input_summary TEXT NOT NULL DEFAULT '',
  output_summary TEXT NOT NULL DEFAULT '',
  blocker_reason TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workflow_steps DROP CONSTRAINT IF EXISTS workflow_steps_status_check;
ALTER TABLE public.workflow_steps
  ADD CONSTRAINT workflow_steps_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'skipped', 'failed'));

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON public.workflow_steps(workflow_id, step_order);

DROP TRIGGER IF EXISTS workflow_steps_updated_at ON public.workflow_steps;
CREATE TRIGGER workflow_steps_updated_at
  BEFORE UPDATE ON public.workflow_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- company_outputs — everything the company produces
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID,
  agent_id TEXT NOT NULL DEFAULT '',
  output_type TEXT NOT NULL DEFAULT 'content',
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  source_table TEXT NOT NULL DEFAULT '',
  source_id TEXT NOT NULL DEFAULT '',
  target_table TEXT NOT NULL DEFAULT '',
  target_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'created',
  risk_level TEXT NOT NULL DEFAULT 'low',
  approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  published_url TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_outputs_workflow ON public.company_outputs(workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_outputs_agent ON public.company_outputs(agent_id, created_at DESC);

DROP TRIGGER IF EXISTS company_outputs_updated_at ON public.company_outputs;
CREATE TRIGGER company_outputs_updated_at
  BEFORE UPDATE ON public.company_outputs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- company_decisions — every founder / Gate decision
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID,
  decision_type TEXT NOT NULL DEFAULT 'approval',
  decision_maker TEXT NOT NULL DEFAULT 'founder',
  decision TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  feedback TEXT NOT NULL DEFAULT '',
  impact_score INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_decisions_workflow ON public.company_decisions(workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_decisions_recent ON public.company_decisions(created_at DESC);

-- ---------------------------------------------------------------------------
-- company_bottlenecks — what is slowing the company down
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_bottlenecks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID,
  agent_id TEXT NOT NULL DEFAULT '',
  bottleneck_type TEXT NOT NULL DEFAULT 'slow_workflow',
  description TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'medium',
  recommended_fix TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.company_bottlenecks DROP CONSTRAINT IF EXISTS company_bottlenecks_status_check;
ALTER TABLE public.company_bottlenecks
  ADD CONSTRAINT company_bottlenecks_status_check
  CHECK (status IN ('open', 'resolved', 'ignored'));

CREATE INDEX IF NOT EXISTS idx_company_bottlenecks_status ON public.company_bottlenecks(status, created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.company_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_bottlenecks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_os_all_company_workflows" ON public.company_workflows;
CREATE POLICY "marketing_os_all_company_workflows" ON public.company_workflows FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marketing_os_all_workflow_steps" ON public.workflow_steps;
CREATE POLICY "marketing_os_all_workflow_steps" ON public.workflow_steps FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marketing_os_all_company_outputs" ON public.company_outputs;
CREATE POLICY "marketing_os_all_company_outputs" ON public.company_outputs FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marketing_os_all_company_decisions" ON public.company_decisions;
CREATE POLICY "marketing_os_all_company_decisions" ON public.company_decisions FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marketing_os_all_company_bottlenecks" ON public.company_bottlenecks;
CREATE POLICY "marketing_os_all_company_bottlenecks" ON public.company_bottlenecks FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
