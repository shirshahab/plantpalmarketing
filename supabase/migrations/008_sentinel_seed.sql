-- PlantPal Marketing OS — Phase 7 Sentinel seed data
-- Run AFTER 007_sentinel_competitor_intel.sql

INSERT INTO public.competitor_scoreboard (
  name, slug, estimated_growth, app_store_rank, review_trend, review_score,
  social_engagement_score, new_features_count, recent_campaigns, threat_level, opportunity_level, notes
) VALUES
  ('PictureThis', 'picturethis', 72, 14, 'stable', 4.6, 88, 2,
   '["Plant ID TikTok Challenge", "Spring identification push"]', 78, 45,
   'Dominant plant ID brand. Viral social playbook is strong.'),
  ('Planta', 'planta', 65, 22, 'improving', 4.5, 76, 3,
   '["Smart Water weather sync", "Premium trial campaign"]', 82, 52,
   'AI watering reminders gaining traction. Direct PlantPal overlap.'),
  ('PlantIn', 'plantin', 58, 31, 'stable', 4.3, 62, 1,
   '["Disease detection beta ads"]', 55, 38, 'Mid-tier ID + care hybrid.'),
  ('Greg', 'greg', 81, 18, 'improving', 4.7, 84, 4,
   '["Community plant swaps", "Influencer garden tours"]', 75, 60,
   'Fast-growing community angle. Strong creator partnerships.'),
  ('Blossom', 'blossom', 48, 45, 'declining', 4.1, 55, 1,
   '["Valentine plant gift push"]', 40, 35, 'Slowing growth but loyal user base.'),
  ('PlantNet', 'plantnet', 35, 67, 'stable', 4.4, 41, 0,
   '["Academic partnership posts"]', 30, 25, 'Research-focused, less consumer threat.'),
  ('Gardenia', 'gardenia', 52, 38, 'negative_spike', 3.8, 48, 2,
   '["Outdoor garden planner ads"]', 45, 55, 'Negative review trend — opportunity to capture churned users.'),
  ('Garden Answers', 'garden-answers', 44, 52, 'stable', 4.0, 50, 1,
   '["Q&A forum promoted content"]', 38, 42, 'Forum-style community, older demographic.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.competitor_intel_alerts (competitor, alert_type, title, description, severity, source, recommended_action) VALUES
  ('Planta', 'new_feature', 'Smart Water weather sync launched', 'Planta now adjusts watering schedules based on local weather forecasts. Trending positive on App Store.', 'high', 'App Store', 'Highlight PlantPal''s personalized per-plant scheduling vs generic weather sync.'),
  ('PictureThis', 'viral_post', 'TikTok ID challenge — 2.1M views', '#WhatPlantIsThis challenge resurfacing with celebrity gardener participation.', 'high', 'TikTok', 'Counter with PlantPal care-after-ID content — identification is step one, thriving is step two.'),
  ('Greg', 'partnership_discovered', 'Greg × @gardenwithjess collaboration', 'Greg partnered with 84k-follower creator for ''30-day plant care'' series.', 'medium', 'Instagram', 'Accelerate Scout outreach to similar creators before Greg locks exclusives.'),
  ('Gardenia', 'negative_reviews', 'Review trend declining — 3.8 stars', '15% increase in 1-star reviews citing ''inaccurate outdoor advice'' in last 30 days.', 'medium', 'App Store', 'Target outdoor gardeners with PlantPal''s zone-aware care content.'),
  ('Planta', 'new_ad', 'Facebook ad campaign discovered', 'Planta running ''Never kill a plant again'' video ads in US/UK, $50k+ estimated spend.', 'high', 'Meta Ad Library', 'Audit our ad messaging differentiation. Emphasize confidence, not fear.'),
  ('Greg', 'app_store_ranking', 'Greg climbed to #18 Lifestyle', 'Up 6 positions in 14 days. Strong review velocity.', 'medium', 'App Store', 'Monitor feature parity — community features are Greg''s moat.');

INSERT INTO public.competitor_daily_briefs (
  biggest_threat, biggest_opportunity, recommended_response, alerts_count, competitors_scanned
) VALUES (
  'Planta''s Smart Water + aggressive Facebook ad spend — direct overlap with PlantPal''s core watering value prop.',
  'Gardenia negative review spike — outdoor gardeners frustrated with inaccurate advice. PlantPal can win with zone-aware care.',
  '1) Publish ''care after ID'' content countering PictureThis virality. 2) Launch outdoor gardener landing page. 3) Brief Scout on creator deals before Greg expands partnerships.',
  6, 8
);

INSERT INTO public.agent_activity_log (agent_id, action, detail) VALUES
  ('sentinel', 'alert_detected', 'Sentinel alert: Planta Smart Water feature launch — severity high'),
  ('sentinel', 'analyzing', 'Analyzing PictureThis TikTok virality — 2.1M views tracked'),
  ('sentinel', 'monitoring', 'Scanning 8 competitors: rankings, reviews, social, ads'),
  ('sentinel', 'reporting', 'Daily brief published — biggest threat: Planta ad campaign');
