-- PlantPal Marketing OS — Phase 18 seed: Integrations
-- Run AFTER 029_integrations_layer.sql

INSERT INTO public.integration_provider_status (provider, status, configured, metadata) VALUES
  ('openai', 'disconnected', FALSE, '{"uses":["agent_reasoning","content_generation","creative_scoring","executive_summaries"]}'),
  ('openweather', 'disconnected', FALSE, '{"uses":["gardening_recommendations","weather_content","local_alerts"]}'),
  ('plantnet', 'disconnected', FALSE, '{"uses":["plant_identification","plant_content","health_context"]}'),
  ('perenual', 'disconnected', FALSE, '{"uses":["plant_care","watering","sunlight","database_enrichment"]}'),
  ('serpapi', 'disconnected', FALSE, '{"uses":["trend_discovery","creator_discovery","competitor_discovery","search_demand"]}'),
  ('x', 'disconnected', FALSE, '{"uses":["metrics","engagement","drafts","queue","publish_after_approval"]}')
ON CONFLICT (provider) DO NOTHING;

INSERT INTO public.x_account_snapshots (follower_count, following_count, tweet_count, username, display_name) VALUES
  (2840, 412, 186, 'PlantPalApp', 'PlantPal');

INSERT INTO public.x_posts (tweet_id, text, author_username, like_count, retweet_count, reply_count, impression_count, posted_at, is_plantpal) VALUES
  ('seed_001', 'Your fiddle leaf fig looking sad? Plant Doctor diagnoses root rot before it''s too late 🌿', 'PlantPalApp', 142, 28, 19, 4200, NOW() - INTERVAL '2 days', TRUE),
  ('seed_002', '3 signs you''re overwatering (and how to fix it) 🪴 Thread-worthy tips inside the app', 'PlantPalApp', 89, 15, 12, 3100, NOW() - INTERVAL '4 days', TRUE),
  ('seed_003', 'Plant ID walk: identified 12 plants on my first neighborhood stroll. Game changer.', 'PlantPalApp', 201, 45, 34, 5800, NOW() - INTERVAL '6 days', TRUE);

INSERT INTO public.x_post_queue (text, status, engagement_score, created_by_agent) VALUES
  ('Spring watering cheat sheet — save this before your weekend plant haul 🌱', 'draft', 0, 'bloom'),
  ('New in Plant Doctor: faster diagnosis for yellow leaves. Try it free this week.', 'gate_approval', 72, 'bloom'),
  ('Community tip: group your succulents by light needs. Small change, big results.', 'queued', 65, 'bloom');
