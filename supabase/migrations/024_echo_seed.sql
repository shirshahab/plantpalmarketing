-- PlantPal Marketing OS — Phase 15 seed: Echo Voice of Customer
-- Run AFTER 023_echo_voice_of_customer.sql

INSERT INTO public.echo_sentiment (
  id, snapshot_date, positive_count, neutral_count, negative_count, urgent_count,
  positive_pct, negative_pct, trend_direction, top_category, notes
) VALUES (
  'e1000000-0000-4000-8000-000000000001', CURRENT_DATE,
  5, 4, 5, 1, 33.3, 40.0, 'stable', 'landscape_designer',
  '1 urgent item requires immediate review — iOS Plant Doctor crash'
);

INSERT INTO public.echo_feature_requests (
  id, feature_name, category, description, frequency, priority, impact, estimated_demand, trend, report_date
) VALUES
  ('e2000000-0000-4000-8000-000000000001', 'Landscape Designer', 'landscape_designer',
   'Visual backyard and bed planning tool', 42, 91, 88, 420, 'rising', CURRENT_DATE),
  ('e2000000-0000-4000-8000-000000000002', 'Vegetable Gardening Track', 'academy',
   'Dedicated vegetable content — tomatoes, peppers, herbs', 38, 84, 75, 380, 'rising', CURRENT_DATE),
  ('e2000000-0000-4000-8000-000000000003', 'Local Community Groups', 'community',
   'Connect with plant parents in your city', 24, 72, 65, 240, 'emerging', CURRENT_DATE),
  ('e2000000-0000-4000-8000-000000000004', 'Custom Reminder Schedules', 'reminders',
   'Flexible notification timing per plant', 19, 68, 70, 190, 'stable', CURRENT_DATE),
  ('e2000000-0000-4000-8000-000000000005', 'Multi-Plant Dashboard', 'tasks',
   'Overview of all plants health at a glance', 15, 62, 60, 150, 'stable', CURRENT_DATE);

INSERT INTO public.echo_love_signals (
  id, feature, quote, source, category, marketing_potential, testimonial_ready, ambassador_potential, report_date
) VALUES
  ('e3000000-0000-4000-8000-000000000001', 'Plant Doctor',
   'Plant Doctor saved my fiddle leaf fig — diagnosed root rot before I killed it!', 'app_review', 'plant_doctor', 92, TRUE, FALSE, CURRENT_DATE),
  ('e3000000-0000-4000-8000-000000000002', 'Plant Identification',
   'Best plant ID app I''ve used — identified 12 plants on my first walk', 'app_review', 'plant_identification', 88, TRUE, TRUE, CURRENT_DATE),
  ('e3000000-0000-4000-8000-000000000003', 'Watering Reminders',
   'The watering reminders are a game changer — my plants have never looked better', 'tiktok_comment', 'reminders', 85, TRUE, TRUE, CURRENT_DATE);

INSERT INTO public.echo_churn_risks (
  id, title, description, churn_reason, severity, affected_users_estimate, suggested_action, report_date
) VALUES
  ('e4000000-0000-4000-8000-000000000001', 'Onboarding confusion blocking activation',
   'Multiple users can''t find how to add first plant — high drop-off risk', 'confusion', 'high', 340,
   'Simplify onboarding to 2 steps — add plant CTA on home screen', CURRENT_DATE),
  ('e4000000-0000-4000-8000-000000000002', 'iOS Plant Doctor crash',
   'App crashes on iOS 18 when opening Plant Doctor', 'bugs', 'high', 95,
   'Escalate to engineering — urgent bug fix', CURRENT_DATE),
  ('e4000000-0000-4000-8000-000000000003', 'Premium pricing pushback',
   'Users feel free tier too limited for premium price', 'pricing', 'medium', 180,
   'Highlight Plant Doctor + Academy value in upgrade prompt', CURRENT_DATE);

INSERT INTO public.echo_reports (id, report_type, run_date, executive_summary, sections) VALUES
  ('e5000000-0000-4000-8000-000000000001', 'daily', CURRENT_DATE,
   'Echo analyzed 15 feedback items today. 5 complaints, 5 feature requests tracked. 1 urgent issue needs attention. Top request: Landscape Designer. Echo provides insights — humans decide.',
   '{
     "topComplaints": ["I signed up but can''t figure out how to add my first plant", "Premium is too expensive for what you get", "Task list is confusing — too many notifications"],
     "topFeatureRequests": ["Landscape Designer (42 requests)", "Vegetable Gardening Track (38 requests)", "Local Community Groups (24 requests)"],
     "topPositiveFeedback": ["Plant Doctor saved my fiddle leaf fig", "Best plant ID app I''ve used", "Watering reminders are a game changer"],
     "urgentIssues": ["App crashes every time I open Plant Doctor on iOS 18"],
     "recommendedActions": ["Address urgent: App crashes on iOS 18", "Evaluate roadmap priority for Landscape Designer", "Mitigate churn risk: Onboarding confusion"]
   }'::jsonb),
  ('e5000000-0000-4000-8000-000000000002', 'weekly', CURRENT_DATE - INTERVAL '1 day',
   'Weekly Voice of Customer: Users love Plant Doctor and reminders. Top demand: Landscape Designer. Biggest risk: onboarding confusion.',
   '{
     "topComplaints": ["Onboarding too many questions", "Premium pricing", "Notification overload"],
     "topFeatureRequests": ["Landscape Designer (42)", "Vegetable Gardening (38)", "Community Groups (24)"],
     "topPositiveFeedback": ["Plant Doctor incredible", "Academy helped me in 30 days"],
     "urgentIssues": ["iOS Plant Doctor crash"],
     "recommendedActions": ["Fix onboarding", "Prioritize Landscape Designer", "Escalate iOS crash"],
     "whatUsersLove": ["Plant Doctor: saved my fiddle leaf fig", "Reminders: game changer", "Academy: plant killer to confident parent"],
     "whatUsersHate": ["Can''t find add plant button", "Premium too expensive", "Too many notifications"],
     "whatUsersWantNext": ["Landscape Designer — 42 requests (rising)", "Vegetable Gardening — 38 requests (rising)"],
     "biggestRetentionRisks": ["Onboarding confusion blocking activation", "iOS Plant Doctor crash"],
     "productRecommendations": ["Prioritize Landscape Designer", "Fix onboarding", "Vegetable gardening Academy track"]
   }'::jsonb);

INSERT INTO public.echo_feedback (
  id, source, category, feedback_type, sentiment, content, author, rating, report_date
) VALUES
  ('e6000000-0000-4000-8000-000000000001', 'app_review', 'plant_doctor', 'praise', 'positive',
   'Plant Doctor saved my fiddle leaf fig — diagnosed root rot before I killed it!', 'Sarah M.', 5, CURRENT_DATE),
  ('e6000000-0000-4000-8000-000000000002', 'reddit', 'landscape_designer', 'feature_request', 'neutral',
   'Would love a landscape designer feature to plan my backyard beds visually', 'u/garden_planner_42', NULL, CURRENT_DATE),
  ('e6000000-0000-4000-8000-000000000003', 'support_ticket', 'onboarding', 'confusion', 'negative',
   'I signed up but can''t figure out how to add my first plant — where is the button?', 'Ticket #1847', NULL, CURRENT_DATE),
  ('e6000000-0000-4000-8000-000000000004', 'survey', 'academy', 'feature_request', 'neutral',
   'Need more vegetable gardening content in Academy — tomatoes, peppers, herbs', 'Survey #892', NULL, CURRENT_DATE),
  ('e6000000-0000-4000-8000-000000000005', 'app_review', 'performance', 'bug_report', 'urgent',
   'App crashes every time I open Plant Doctor on iOS 18 — unusable', 'Alex T.', 1, CURRENT_DATE);

INSERT INTO public.agent_activity_log (agent_id, action, detail, metadata) VALUES
  ('echo', 'voc_scan', 'VoC scan complete — top request: Landscape Designer (42 users)', '{"feedback":15,"features":5,"urgent":1}'),
  ('echo', 'feature_demand', 'Echo found 42 users requesting Landscape Designer.', '{"feature":"landscape_designer"}'),
  ('echo', 'sentiment', 'Echo discovered strong positive sentiment around Plant Doctor.', '{"feature":"plant_doctor"}'),
  ('echo', 'churn_risk', 'Echo identified onboarding confusion.', '{"risk":"onboarding"}'),
  ('echo', 'trend', 'Echo detected increasing demand for vegetable gardening.', '{"category":"academy"}');
