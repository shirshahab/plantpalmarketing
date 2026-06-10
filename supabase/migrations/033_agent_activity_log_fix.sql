-- Fix HQ demo mode: agent_activity_log missing (PGRST205)
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.agent_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_activity_agent
  ON public.agent_activity_log(agent_id, created_at DESC);

ALTER TABLE public.agent_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_os_all_agent_activity" ON public.agent_activity_log;
CREATE POLICY "marketing_os_all_agent_activity"
  ON public.agent_activity_log FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.agent_activity_log (agent_id, action, detail)
SELECT v.agent_id, v.action, v.detail
FROM (VALUES
  ('scout', 'found_creator', 'Scout found creator: @gardenmomdaily — partnership score 91'),
  ('roots', 'found_discussion', 'Roots found discussion: "My monstera is dying."'),
  ('sentinel', 'alert_detected', 'Sentinel alert: Planta Smart Water feature launch — severity high')
) AS v(agent_id, action, detail)
WHERE NOT EXISTS (
  SELECT 1 FROM public.agent_activity_log a WHERE a.agent_id = v.agent_id AND a.detail = v.detail
);
