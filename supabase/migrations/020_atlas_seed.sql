-- PlantPal Marketing OS — Phase 13 seed: Atlas Head of Growth
-- Run AFTER 019_atlas_head_of_growth.sql

INSERT INTO public.atlas_growth_metrics (
  id, snapshot_date, total_users, total_installs, waitlist_count,
  weekly_active_users, monthly_active_users, traffic_sessions,
  conversion_rate, engagement_rate, retention_d7, retention_d30,
  growth_stage, channel_breakdown
) VALUES (
  'a1000000-0000-4000-8000-000000000001', CURRENT_DATE,
  2840, 4200, 890, 1120, 2100, 12400,
  3.20, 38.00, 32.00, 18.00, '1k_to_10k',
  '{"tiktok":38,"instagram":24,"youtube":12,"organic":16,"pinterest":6,"x":4}'::jsonb
);

INSERT INTO public.atlas_growth_reports (id, report_type, run_date, executive_summary, sections) VALUES
  ('a2000000-0000-4000-8000-000000000001', 'daily', CURRENT_DATE,
   'Today''s Growth Brief: 2,840 users (1k → 10k). Biggest opportunity: Prioritize tiktok over x. Biggest risk: Poor D7 retention.',
   '{
     "biggestOpportunity": "Prioritize TikTok over X",
     "biggestRisk": "Poor D7 retention — only 32% return after 7 days",
     "fastestWin": "Launch Garden Streak Program",
     "bestPerformingChannel": "tiktok (38% of installs)",
     "worstPerformingChannel": "x (4% of installs)",
     "recommendedAction": "TikTok drives 38% of installs vs x at 4%. Fastest path to growth is doubling down on TikTok.",
     "totalUsers": 2840,
     "growthStage": "1k_to_10k"
   }'::jsonb),
  ('a2000000-0000-4000-8000-000000000002', 'weekly', CURRENT_DATE - INTERVAL '1 day',
   'Weekly Growth Strategy Memo: 2,840 users. Double down on tiktok. Stop: Reduce x posting frequency.',
   '{
     "biggestOpportunity": "Scale creator partnerships for installs",
     "biggestRisk": "Weak landing page conversion",
     "fastestWin": "Plant Rescue Challenge with @PlantDadMike",
     "bestPerformingChannel": "tiktok (38%)",
     "worstPerformingChannel": "x (4%)",
     "recommendedAction": "Activate referral loop + creator ambassadors",
     "whatWorked": ["tiktok outperformed targets", "Oak partnerships: 2,163 attributed installs", "Bloom TikTok concepts scoring 80+"],
     "whatFailed": ["x underdelivering", "D7 retention at 32% — below target", "Pinterest underindexed"],
     "doubleDown": ["Prioritize tiktok over x", "Scale creator partnerships", "Launch Garden Streak Program"],
     "stopDoing": ["Reduce x posting frequency", "Pause low-viral Bloom formats"]
   }'::jsonb);

INSERT INTO public.atlas_forecasts (id, horizon, predicted_users, predicted_installs, growth_rate_pct, confidence, assumptions, report_date) VALUES
  ('a3000000-0000-4000-8000-000000000001', '7d', 3010, 84, 5.50, 82, 'Based on 5.5% weekly growth, current 2840 users', CURRENT_DATE),
  ('a3000000-0000-4000-8000-000000000002', '30d', 3520, 336, 22.00, 72, 'Assumes no major channel changes; Oak partnerships hold steady', CURRENT_DATE),
  ('a3000000-0000-4000-8000-000000000003', '90d', 4800, 924, 66.00, 58, 'Includes Creator Ambassador + Streak Program experiments', CURRENT_DATE),
  ('a3000000-0000-4000-8000-000000000004', 'annual', 12400, 7560, 286.00, 42, 'Stage: 1k_to_10k — high uncertainty beyond 90 days', CURRENT_DATE);

INSERT INTO public.atlas_experiments (id, name, hypothesis, expected_outcome, effort, impact, priority_score, status, results, report_date) VALUES
  ('a4000000-0000-4000-8000-000000000001', 'Referral Campaign',
   'Plant parents refer friends when rewarded with premium care streaks',
   '+15% weekly installs from word-of-mouth', 'medium', 78, 74, 'proposed', '', CURRENT_DATE),
  ('a4000000-0000-4000-8000-000000000002', 'Plant Rescue Challenge',
   '30-day rescue challenge drives viral TikTok content and app installs',
   '+800 installs in 30 days via creator amplification', 'low', 85, 88, 'proposed', '', CURRENT_DATE),
  ('a4000000-0000-4000-8000-000000000003', 'Creator Ambassador Program',
   '5 micro-creators with unique codes outperform paid ads on CAC',
   '2,000 installs/month at <$2 CAC', 'medium', 88, 86, 'proposed', '', CURRENT_DATE),
  ('a4000000-0000-4000-8000-000000000004', 'Garden Streak Program',
   'Daily care streaks with push notifications improve D7 retention by 12%',
   'Retention D7 from 34% → 46%', 'medium', 82, 80, 'proposed', '', CURRENT_DATE);

INSERT INTO public.atlas_recommendations (
  id, title, description, category, reach, cost, difficulty, virality,
  revenue_potential, retention_potential, priority_score, source_agent, report_date
) VALUES
  ('a5000000-0000-4000-8000-000000000001', 'Prioritize tiktok over x',
   'tiktok drives 38% of installs vs x at 4%. Fastest path to growth is doubling down on tiktok.',
   'channel', 114, 30, 25, 90, 55, 45, 82, 'sprout', CURRENT_DATE),
  ('a5000000-0000-4000-8000-000000000002', 'Scale creator partnerships for installs',
   'Oak partnerships attributed 2,163 installs — predict 2,000+ this month with 3 more ambassadors',
   'acquisition', 75, 40, 50, 55, 80, 70, 79, 'oak', CURRENT_DATE),
  ('a5000000-0000-4000-8000-000000000003', 'Pinterest is an underutilized acquisition channel',
   'Plant care visual search on Pinterest underindexed — carousel content from Bloom could capture high-intent users',
   'acquisition', 70, 25, 35, 65, 50, 60, 76, 'bloom', CURRENT_DATE),
  ('a5000000-0000-4000-8000-000000000004', 'Launch Garden Streak Program',
   'Retention is the bottleneck to 10k users — streaks + push notifications are the fastest win',
   'retention', 60, 35, 40, 50, 45, 90, 74, 'atlas', CURRENT_DATE),
  ('a5000000-0000-4000-8000-000000000005', 'Activate referral loop + creator ambassadors',
   '1k→10k requires word-of-mouth — referral campaign + 5 creator codes',
   'acquisition', 75, 35, 45, 75, 65, 55, 73, 'atlas', CURRENT_DATE);

INSERT INTO public.atlas_bottlenecks (
  id, bottleneck_type, title, description, severity, suggested_fix, metric_value, benchmark_value, report_date
) VALUES
  ('a6000000-0000-4000-8000-000000000001', 'conversion', 'Weak landing page conversion',
   'Conversion rate 3.2% is below 4% benchmark for plant apps', 'medium',
   'A/B test hero copy emphasizing save your plants + add social proof from Oak partnerships', 3.20, 4.00, CURRENT_DATE),
  ('a6000000-0000-4000-8000-000000000002', 'retention', 'Poor D7 retention',
   'Only 32% of users return after 7 days', 'medium',
   'Add plant rescue reminders + weekly care digest email', 32.00, 40.00, CURRENT_DATE),
  ('a6000000-0000-4000-8000-000000000003', 'channel_underperformance', 'Underperforming channel: x',
   'x drives only 4% of installs — below 5% threshold', 'low',
   'Pause x spend; reallocate to top channel. Test 2 weeks before deprioritizing.', 4.00, 5.00, CURRENT_DATE);

INSERT INTO public.agent_activity_log (agent_id, action, detail, metadata) VALUES
  ('atlas', 'growth_brief', 'Growth brief generated — top opportunity: Prioritize tiktok over x', '{"recommendations":5,"experiments":4,"bottlenecks":3}'),
  ('atlas', 'recommendation', 'Atlas recommends prioritizing TikTok over X.', '{"channel":"tiktok"}'),
  ('atlas', 'forecast', 'Atlas predicts creator partnerships could generate 2,000 installs this month.', '{"source":"oak"}'),
  ('atlas', 'recommendation', 'Atlas identified Pinterest as an underutilized acquisition channel.', '{"channel":"pinterest"}'),
  ('atlas', 'experiment', 'Atlas recommends launching a Plant Rescue Challenge.', '{"experiment":"Plant Rescue Challenge"}');
