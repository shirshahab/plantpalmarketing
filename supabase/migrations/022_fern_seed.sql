-- PlantPal Marketing OS — Phase 14 seed: Fern User Acquisition
-- Run AFTER 021_fern_user_acquisition.sql

INSERT INTO public.fern_opportunities (
  id, title, description, traffic_source, opportunity_type,
  reach, cost, difficulty, virality, estimated_installs, priority_score, source_agent, report_date
) VALUES
  ('f1000000-0000-4000-8000-000000000001', 'Partner with 50 gardening creators',
   'Scout found high-fit creators — micro-creator codes outperform paid ads on CAC.',
   'influencers', 'partnership', 85, 45, 55, 80, 2000, 88, 'scout', CURRENT_DATE),
  ('f1000000-0000-4000-8000-000000000002', 'Launch a 30 Day Plant Rescue Challenge',
   'Viral TikTok loop — users document saves with PlantPal reminders.',
   'tiktok', 'viral_loop', 90, 25, 35, 92, 1200, 91, 'bloom', CURRENT_DATE),
  ('f1000000-0000-4000-8000-000000000003', 'Build Pinterest traffic funnels',
   'Pinterest underutilized at 6% — carousel + save-to-board funnels could add 500 monthly installs.',
   'pinterest', 'traffic', 75, 22, 38, 68, 500, 84, 'bloom', CURRENT_DATE),
  ('f1000000-0000-4000-8000-000000000004', 'Double TikTok posting cadence',
   'TikTok drives 38% of installs — Fern recommends prioritizing TikTok over X.',
   'tiktok', 'traffic', 88, 20, 22, 90, 1100, 87, 'sprout', CURRENT_DATE),
  ('f1000000-0000-4000-8000-000000000005', 'Run a waitlist referral campaign',
   '890 waitlist signups — referral unlock for premium trial accelerates word-of-mouth.',
   'referral', 'referral', 60, 15, 25, 70, 600, 79, 'ivy', CURRENT_DATE),
  ('f1000000-0000-4000-8000-000000000006', 'Create ZIP-based gardening reports',
   'Local SEO — city-specific plant care reports rank in Google Search.',
   'google_search', 'acquisition', 70, 30, 50, 40, 400, 68, 'atlas', CURRENT_DATE),
  ('f1000000-0000-4000-8000-000000000007', 'Create local gardening Facebook groups',
   'Roots community opportunities — seed helpful groups in top metros.',
   'facebook_groups', 'community', 65, 20, 40, 55, 350, 72, 'roots', CURRENT_DATE),
  ('f1000000-0000-4000-8000-000000000008', 'Instagram Reels plant parent check-ins',
   'Repurpose Sage-approved Bloom Reels — weekly check-in format.',
   'instagram', 'acquisition', 80, 28, 32, 75, 650, 81, 'bloom', CURRENT_DATE),
  ('f1000000-0000-4000-8000-000000000009', 'Scale nursery partnership install funnel',
   'Oak attributed 2,163 installs — in-store QR on plant tags is highest-ROI channel.',
   'partnerships', 'partnership', 72, 35, 48, 50, 800, 76, 'oak', CURRENT_DATE),
  ('f1000000-0000-4000-8000-000000000010', 'Reddit helpful-reply acquisition loop',
   'Roots drafts helpful replies in r/houseplants — high-intent traffic, never spammy.',
   'reddit', 'community', 55, 10, 30, 45, 280, 70, 'roots', CURRENT_DATE);

INSERT INTO public.fern_experiments (id, name, hypothesis, effort, expected_impact, status, results, report_date) VALUES
  ('f2000000-0000-4000-8000-000000000001', 'Plant Rescue Challenge',
   '30-day rescue challenge on TikTok drives viral installs via creator amplification', 'low', 88, 'proposed', '', CURRENT_DATE),
  ('f2000000-0000-4000-8000-000000000002', 'Creator Ambassador Program',
   '5 micro-creators with unique codes outperform paid ads this month', 'medium', 90, 'proposed', '', CURRENT_DATE),
  ('f2000000-0000-4000-8000-000000000003', 'Pinterest Save Funnel',
   'Carousel pins with care-plan CTAs convert visual search intent to installs', 'low', 72, 'proposed', '', CURRENT_DATE),
  ('f2000000-0000-4000-8000-000000000004', 'Waitlist Referral Unlock',
   'Refer-3-get-premium unlock grows waitlist 40% in 2 weeks', 'low', 65, 'proposed', '', CURRENT_DATE),
  ('f2000000-0000-4000-8000-000000000005', 'Tomato Challenge Campaign',
   'Seasonal tomato rescue content drives installs from gardening audience', 'low', 82, 'proposed', '', CURRENT_DATE);

INSERT INTO public.fern_forecasts (id, horizon, traffic_source, predicted_installs, confidence, assumptions, report_date) VALUES
  ('f3000000-0000-4000-8000-000000000001', '7d', 'all', 84, 80, 'Baseline weekly install velocity', CURRENT_DATE),
  ('f3000000-0000-4000-8000-000000000002', '30d', 'all', 336, 72, 'Current channel mix holds', CURRENT_DATE),
  ('f3000000-0000-4000-8000-000000000003', 'monthly', 'tiktok', 128, 75, 'TikTok share grows with doubled cadence', CURRENT_DATE),
  ('f3000000-0000-4000-8000-000000000004', 'monthly', 'pinterest', 500, 68, 'Pinterest funnel — 500 monthly install opportunity', CURRENT_DATE),
  ('f3000000-0000-4000-8000-000000000005', 'monthly', 'influencers', 2000, 62, 'Creator partnerships outperform paid ads', CURRENT_DATE),
  ('f3000000-0000-4000-8000-000000000006', '90d', 'all', 940, 50, 'Includes Rescue Challenge + ambassador if approved', CURRENT_DATE);

INSERT INTO public.agent_activity_log (agent_id, action, detail, metadata) VALUES
  ('fern', 'acquisition_scan', 'Acquisition scan complete — top opportunity: Launch a 30 Day Plant Rescue Challenge (~1200 installs)', '{"opportunities":10}'),
  ('fern', 'opportunity', 'Fern identified a Pinterest opportunity worth 500 monthly installs.', '{"channel":"pinterest"}'),
  ('fern', 'recommendation', 'Fern recommends a Tomato Challenge campaign.', '{"experiment":"Tomato Challenge"}'),
  ('fern', 'forecast', 'Fern predicts creator partnerships will outperform paid ads this month.', '{"channel":"influencers","installs":2000}');
