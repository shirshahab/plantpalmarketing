-- PlantPal Marketing OS — Phase 15: Agent Collaboration System
-- Run AFTER 024_echo_seed.sql

-- Shared agent slug constraint for inter-agent communication
-- gate = Approval Agent (Gate), sprout = Publishing Agent (Sprout)

-- ---------------------------------------------------------------------------
-- agent_messages — inter-agent messaging
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent TEXT NOT NULL CHECK (
    from_agent IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  to_agent TEXT NOT NULL CHECK (
    to_agent IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  message_type TEXT NOT NULL DEFAULT 'handoff' CHECK (
    message_type IN ('handoff', 'request', 'response', 'notification', 'status', 'broadcast')
  ),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (
    priority IN ('low', 'medium', 'high', 'urgent')
  ),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'unread' CHECK (
    status IN ('unread', 'read', 'acknowledged', 'archived')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_to ON public.agent_messages(to_agent, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_messages_from ON public.agent_messages(from_agent, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_messages_pair ON public.agent_messages(from_agent, to_agent, created_at DESC);

CREATE TRIGGER agent_messages_updated_at
  BEFORE UPDATE ON public.agent_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- agent_tasks — delegated work between agents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_agent TEXT NOT NULL CHECK (
    assigned_agent IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  created_by TEXT NOT NULL CHECK (
    created_by IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  task_type TEXT NOT NULL DEFAULT 'action' CHECK (
    task_type IN (
      'content_brief', 'partnership_review', 'community_response', 'competitor_analysis',
      'growth_recommendation', 'voc_insight', 'publish_schedule', 'creative_review',
      'creator_outreach', 'executive_brief', 'acquisition_test', 'approval_gate'
    )
  ),
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (
    priority IN ('low', 'medium', 'high', 'urgent')
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled')
  ),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_assigned ON public.agent_tasks(assigned_agent, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_by ON public.agent_tasks(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON public.agent_tasks(status, priority);

CREATE TRIGGER agent_tasks_updated_at
  BEFORE UPDATE ON public.agent_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- agent_events — company-wide activity events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'scout_found_creator', 'roots_found_discussion', 'sentinel_detected_feature',
      'bloom_generated_content', 'sage_rejected_content', 'sage_approved_content',
      'gate_approved_content', 'gate_rejected_content', 'oak_created_partnership',
      'ivy_executive_brief', 'atlas_growth_insight', 'fern_acquisition_opportunity',
      'echo_voc_insight', 'agent_message_sent', 'agent_task_assigned', 'agent_task_completed'
    )
  ),
  source_agent TEXT NOT NULL CHECK (
    source_agent IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  target_agent TEXT CHECK (
    target_agent IS NULL OR target_agent IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  impact TEXT NOT NULL DEFAULT '',
  related_message_id UUID REFERENCES public.agent_messages(id) ON DELETE SET NULL,
  related_task_id UUID REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_events_created ON public.agent_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_source ON public.agent_events(source_agent, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_type ON public.agent_events(event_type);

-- RLS
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_os_all_agent_messages" ON public.agent_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_agent_tasks" ON public.agent_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_agent_events" ON public.agent_events FOR ALL USING (true) WITH CHECK (true);
