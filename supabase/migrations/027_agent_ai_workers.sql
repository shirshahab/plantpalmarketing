-- PlantPal Marketing OS — Phase 16: AI Agent Workers
-- Run AFTER 026_agent_collaboration_seed.sql

ALTER TABLE public.agent_activity_log
  DROP CONSTRAINT IF EXISTS agent_activity_log_agent_id_check;

ALTER TABLE public.agent_activity_log
  ADD CONSTRAINT agent_activity_log_agent_id_check
  CHECK (agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate'));

-- ---------------------------------------------------------------------------
-- agent_profiles — role, goal, responsibilities per agent
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL UNIQUE CHECK (
    agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  role TEXT NOT NULL DEFAULT '',
  goal TEXT NOT NULL DEFAULT '',
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  system_prompt TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER agent_profiles_updated_at
  BEFORE UPDATE ON public.agent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- agent_memory — persistent agent memory (facts, patterns, history)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL CHECK (
    agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  memory_key TEXT NOT NULL,
  memory_value TEXT NOT NULL DEFAULT '',
  memory_type TEXT NOT NULL DEFAULT 'fact' CHECK (
    memory_type IN ('fact', 'pattern', 'history', 'insight', 'preference')
  ),
  importance INTEGER NOT NULL DEFAULT 50 CHECK (importance BETWEEN 1 AND 100),
  source_run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agent_id, memory_key)
);

CREATE INDEX IF NOT EXISTS idx_agent_memory_agent ON public.agent_memory(agent_id, importance DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON public.agent_memory(agent_id, memory_type);

CREATE TRIGGER agent_memory_updated_at
  BEFORE UPDATE ON public.agent_memory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- agent_conversations — LLM turn history per run
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL CHECK (
    agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  run_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_run ON public.agent_conversations(run_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent ON public.agent_conversations(agent_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- agent_decisions — structured AI outputs and recommendations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL CHECK (
    agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  run_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE SET NULL,
  decision_type TEXT NOT NULL DEFAULT 'recommendation' CHECK (
    decision_type IN ('recommendation', 'analysis', 'handoff', 'alert', 'approval_request', 'memory_update')
  ),
  title TEXT NOT NULL DEFAULT '',
  input_summary TEXT NOT NULL DEFAULT '',
  output_json JSONB NOT NULL DEFAULT '{}',
  reasoning TEXT NOT NULL DEFAULT '',
  confidence INTEGER NOT NULL DEFAULT 70 CHECK (confidence BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'rejected', 'executed')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent ON public.agent_decisions(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_run ON public.agent_decisions(run_id);

CREATE TRIGGER agent_decisions_updated_at
  BEFORE UPDATE ON public.agent_decisions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_os_all_agent_profiles" ON public.agent_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_agent_memory" ON public.agent_memory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_agent_conversations" ON public.agent_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_agent_decisions" ON public.agent_decisions FOR ALL USING (true) WITH CHECK (true);
