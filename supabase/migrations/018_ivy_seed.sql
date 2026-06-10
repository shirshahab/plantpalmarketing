-- PlantPal Marketing OS — Phase 12 seed: Ivy Chief of Staff
-- Run AFTER 017_ivy_chief_of_staff.sql

INSERT INTO public.ivy_briefs (id, brief_type, run_date, executive_summary, sections) VALUES
  ('i1000000-0000-4000-8000-000000000001', 'daily', CURRENT_DATE,
   'Good morning. Ivy reviewed all 8 agents overnight. 2 urgent items need your attention today. Top partnership: GreenThumb Nursery Co. (negotiating). First approval: Approve Partnership item in queue.',
   '{
     "executiveSummary": "Good morning. Ivy reviewed all 8 agents overnight. 2 urgent items need your attention today.",
     "topOpportunities": [
       "Convert @UrbanJungleJen to Oak pipeline",
       "Engage community trend: Reddit: monstera yellowing leaves help",
       "Amplify top content: tiktok"
     ],
     "highestPriorityApproval": "Approve Partnership outreach to Stone & Stem Landscapers",
     "bestCreatorFound": "@PlantDadMike (mike@plantdadmedia.example) — score 94",
     "bestPartnershipOpportunity": "GreenThumb Nursery Co. (negotiating) — $2,400 attributed",
     "biggestCompetitorThreat": "PlantIn: AI plant diagnosis v2 launch",
     "bestContentCreated": "tiktok: \"Your monstera isn''t dramatic — it''s dehydrated\" — viral 88",
     "communityTrends": [
       "Reddit: beginners asking about overwatering signs",
       "Threads: plant parent guilt and rescue stories trending",
       "Facebook Groups: spring repotting questions spiking"
     ],
     "recommendedActions": [
       "Publish TikTok post today",
       "Prioritize GreenThumb Nursery Co. partnership",
       "Review competitor: PlantIn — AI plant diagnosis v2 launch"
     ]
   }'::jsonb),
  ('i1000000-0000-4000-8000-000000000002', 'weekly', CURRENT_DATE - INTERVAL '2 days',
   'Weekly strategic review: 12 prioritized actions across Scout, Roots, Sentinel, Bloom, Sage, Sprout, Oak, and Gate. Partnership revenue leader: @PlantDadMike. Focus this week on approvals, competitor response, and high-ROI creator conversions.',
   '{
     "executiveSummary": "Weekly strategic review across all agents.",
     "topOpportunities": [
       "Convert @UrbanJungleJen to Oak pipeline",
       "Review Sage rejection patterns for content quality improvements",
       "Audit Sprout publish cadence vs. engagement windows"
     ],
     "highestPriorityApproval": "Approve Partnership outreach to Stone & Stem Landscapers",
     "bestCreatorFound": "@PlantDadMike — score 94",
     "bestPartnershipOpportunity": "@PlantDadMike (active) — $8,900 attributed",
     "biggestCompetitorThreat": "PlantIn: AI plant diagnosis v2 launch",
     "bestContentCreated": "tiktok: viral 88 — Sage approved score 86",
     "communityTrends": ["Repotting season discussions up 40%", "Plant rescue content outperforming care tips"],
     "recommendedActions": [
       "Run Scout + Oak scans to refresh partnership pipeline",
       "Review Sentinel weekly threat landscape",
       "Publish TikTok post today"
     ]
   }'::jsonb);

INSERT INTO public.ivy_recommendations (
  id, category, title, description, priority_score,
  revenue_impact, growth_impact, virality_potential, time_sensitivity,
  source_agent, source_entity_id, brief_date
) VALUES
  ('i2000000-0000-4000-8000-000000000001', 'roi_action',
   'Prioritize GreenThumb Nursery Co. partnership',
   'negotiating — In-store QR → PlantPal care plan for every plant sold.',
   91, 80, 90, 55, 88, 'oak', NULL, CURRENT_DATE),
  ('i2000000-0000-4000-8000-000000000002', 'approval',
   'Approve Partnership outreach to Stone & Stem Landscapers',
   'Partnership outreach to Stone & Stem Landscapers: Tyler — your transformation reels...',
   87, 85, 80, 40, 75, 'oak', 'o1000000-0000-4000-8000-000000000004', CURRENT_DATE),
  ('i2000000-0000-4000-8000-000000000003', 'roi_action',
   'Publish TikTok post today',
   'Your monstera isn''t dramatic — it''s dehydrated',
   84, 45, 75, 85, 90, 'sprout', NULL, CURRENT_DATE),
  ('i2000000-0000-4000-8000-000000000004', 'threat',
   'Review competitor: PlantIn — AI plant diagnosis v2 launch',
   'PlantIn shipped on-device disease detection — may capture diagnosis-intent users.',
   82, 80, 50, 35, 95, 'sentinel', NULL, CURRENT_DATE),
  ('i2000000-0000-4000-8000-000000000005', 'growth_opportunity',
   'Convert @UrbanJungleJen to Oak pipeline',
   'Jen Martinez — 284,000 followers, partnership score 91',
   79, 50, 91, 72, 70, 'scout', NULL, CURRENT_DATE),
  ('i2000000-0000-4000-8000-000000000006', 'growth_opportunity',
   'Engage community trend: Reddit: monstera yellowing leaves',
   'High-urgency opportunity — Roots drafted reply awaiting approval',
   74, 35, 70, 60, 55, 'roots', NULL, CURRENT_DATE),
  ('i2000000-0000-4000-8000-000000000007', 'approval',
   'Approve community reply to r/houseplants thread',
   'Helpful reply draft for overwatering question — never spammy.',
   71, 55, 60, 40, 75, 'roots', NULL, CURRENT_DATE),
  ('i2000000-0000-4000-8000-000000000008', 'threat',
   'Approval backlog: 5 items pending',
   'Gate queue is growing — delays may miss time-sensitive opportunities.',
   68, 55, 45, 30, 78, 'gate', NULL, CURRENT_DATE);

INSERT INTO public.ivy_alerts (
  id, alert_type, title, description, priority_score, source_agent, brief_date
) VALUES
  ('i3000000-0000-4000-8000-000000000001', 'urgent',
   'Competitor feature launch: PlantIn',
   'PlantIn shipped AI plant diagnosis v2 — review positioning and Bloom response content.',
   92, 'sentinel', CURRENT_DATE),
  ('i3000000-0000-4000-8000-000000000002', 'urgent',
   '1 partnership outreach draft awaiting approval',
   'Oak has queued outreach — human approval required before any contact.',
   85, 'oak', CURRENT_DATE),
  ('i3000000-0000-4000-8000-000000000003', 'growth',
   'High-value deal negotiating: GreenThumb Nursery Co.',
   'In-store QR → PlantPal care plan for every plant sold. Track installs from nursery referrals.',
   82, 'oak', CURRENT_DATE);

INSERT INTO public.agent_activity_log (agent_id, action, detail, metadata) VALUES
  ('ivy', 'morning_brief', 'Morning brief generated — top priority: Prioritize GreenThumb Nursery Co. partnership', '{"recommendations":8,"alerts":3}'),
  ('ivy', 'recommendation', 'Ivy recommends approving the GardenMom partnership.', '{"category":"approval"}'),
  ('ivy', 'alert', 'Ivy detected a competitor feature launch requiring review.', '{"source":"sentinel"}'),
  ('ivy', 'recommendation', 'Ivy recommends publishing TikTok #34 today.', '{"source":"sprout"}');
