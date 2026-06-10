-- Phase 22.1 — HQ event-driven workflow choreography log
CREATE TABLE IF NOT EXISTS public.hq_workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  source_agent TEXT NOT NULL CHECK (
    source_agent IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  target_agent TEXT NOT NULL CHECK (
    target_agent IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  trigger_type TEXT NOT NULL CHECK (
    trigger_type IN ('collab_message', 'activity', 'agent_event', 'task', 'demo')
  ),
  trigger_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'completed', 'cancelled')
  ),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hq_workflow_events_trigger ON public.hq_workflow_events(trigger_type, trigger_id);
CREATE INDEX IF NOT EXISTS idx_hq_workflow_events_started ON public.hq_workflow_events(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_hq_workflow_events_agents ON public.hq_workflow_events(source_agent, target_agent);

ALTER TABLE public.hq_workflow_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_os_all_hq_workflow_events" ON public.hq_workflow_events;
CREATE POLICY "marketing_os_all_hq_workflow_events" ON public.hq_workflow_events
  FOR ALL USING (true) WITH CHECK (true);
