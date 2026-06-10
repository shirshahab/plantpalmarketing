-- PlantPal Marketing OS — Phase 11: Oak Partnership Manager Agent
-- Run AFTER 014_sprout_seed.sql

ALTER TABLE public.agent_activity_log
  DROP CONSTRAINT IF EXISTS agent_activity_log_agent_id_check;

ALTER TABLE public.agent_activity_log
  ADD CONSTRAINT agent_activity_log_agent_id_check
  CHECK (agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak'));

-- ---------------------------------------------------------------------------
-- oak_partnership_pipeline — unified partnership CRM
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.oak_partnership_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_lead_id UUID REFERENCES public.creator_leads(id) ON DELETE SET NULL,
  partner_name TEXT NOT NULL,
  partner_type TEXT NOT NULL CHECK (
    partner_type IN (
      'influencer', 'nursery', 'garden_center', 'landscaper',
      'botanical_garden', 'brand', 'seed_company', 'home_garden_brand'
    )
  ),
  contact_name TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'contacted' CHECK (
    stage IN ('contacted', 'replied', 'negotiating', 'active', 'completed')
  ),
  outreach_draft TEXT NOT NULL DEFAULT '',
  collaboration_idea TEXT NOT NULL DEFAULT '',
  follow_up_at TIMESTAMPTZ,
  follow_up_note TEXT NOT NULL DEFAULT '',
  revenue_generated NUMERIC(12,2) NOT NULL DEFAULT 0,
  installs_generated INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),
  notes TEXT NOT NULL DEFAULT '',
  outreach_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oak_pipeline_stage ON public.oak_partnership_pipeline(stage);
CREATE INDEX IF NOT EXISTS idx_oak_pipeline_type ON public.oak_partnership_pipeline(partner_type);
CREATE INDEX IF NOT EXISTS idx_oak_pipeline_follow_up ON public.oak_partnership_pipeline(follow_up_at);
CREATE INDEX IF NOT EXISTS idx_oak_pipeline_lead ON public.oak_partnership_pipeline(creator_lead_id);

CREATE TRIGGER oak_partnership_pipeline_updated_at
  BEFORE UPDATE ON public.oak_partnership_pipeline
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.oak_partnership_pipeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketing_os_all_oak_pipeline" ON public.oak_partnership_pipeline FOR ALL USING (true) WITH CHECK (true);
