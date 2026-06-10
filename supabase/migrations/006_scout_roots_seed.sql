-- PlantPal Marketing OS — Phase 6 seed data for Scout & Roots
-- Run AFTER 005_scout_roots_agents.sql

INSERT INTO public.creator_leads (
  name, handle, platform, category, followers, engagement_rate, average_views,
  location, email, website, partnership_score, audience_fit, engagement_score,
  posting_frequency, content_quality, growth_trend, partnership_status, priority,
  source, suggested_ideas, notes
) VALUES
  ('Jess Martinez', '@gardenwithjess', 'TikTok', 'Balcony Gardening', 84000, 6.20, 45000,
   'Austin, TX', 'jess@gardenwithjess.com', 'https://gardenwithjess.com', 88, 92, 85, 78, 90, 82,
   'high_priority', 'high', 'TikTok',
   '["30-Day Tomato Challenge", "Balcony rescue series with PlantPal"]',
   'Strong audience fit. Posts 4x/week. Authentic voice.'),
  ('Green Thumb Mike', '@greenthumbmike', 'YouTube', 'Vegetable Gardening', 125000, 4.80, 62000,
   'Portland, OR', 'mike@greenthumb.com', '', 82, 88, 72, 85, 84, 75,
   'outreach_pending', 'high', 'YouTube',
   '["Raised bed transformation", "Beginner tomato guide collab"]',
   'Educational content. Long-form fits PlantPal tutorials.'),
  ('Plant Mom Daily', '@gardenmomdaily', 'Instagram', 'Houseplants', 52000, 7.10, 28000,
   'Chicago, IL', 'hello@gardenmomdaily.com', '', 91, 90, 88, 80, 86, 88,
   'high_priority', 'high', 'Instagram',
   '["Plant rescue week", "Monstera care giveaway"]',
   'High engagement. Perfect for rescue content.'),
  ('The Soil Scientist', '@soilscientist', 'YouTube', 'Garden Education', 210000, 3.90, 95000,
   'Denver, CO', '', 'https://soilscientist.co', 76, 82, 65, 70, 92, 68,
   'prospect', 'normal', 'YouTube',
   '["Science-backed care tips series"]',
   'Credible educator. Slower posting cadence.'),
  ('Bloom & Build', '@bloomandbuild', 'Pinterest', 'Garden Design', 38000, 5.50, 12000,
   'Seattle, WA', 'team@bloomandbuild.com', 'https://bloomandbuild.com', 79, 85, 70, 75, 88, 72,
   'prospect', 'normal', 'Pinterest',
   '["Before/after garden design board collab"]',
   'Visual-first audience. Good for carousel content.');

INSERT INTO public.creator_partnerships (creator_lead_id, title, idea_type, description, status)
SELECT id, '30-Day Tomato Challenge', 'challenge',
  'Jess documents 30 days growing tomatoes with PlantPal care reminders. Daily TikTok updates.',
  'recommended'
FROM public.creator_leads WHERE handle = '@gardenwithjess' LIMIT 1;

INSERT INTO public.creator_partnerships (creator_lead_id, title, idea_type, description, status)
SELECT id, 'Plant Rescue Week', 'plant_rescue',
  'Plant Mom Daily rescues 5 dying plants using PlantPal diagnostics. Emotional storytelling.',
  'recommended'
FROM public.creator_leads WHERE handle = '@gardenmomdaily' LIMIT 1;

INSERT INTO public.creator_partnerships (creator_lead_id, title, idea_type, description, status)
SELECT id, 'Raised Bed Transformation', 'garden_transformation',
  'Mike transforms a neglected raised bed over 6 weeks with PlantPal scheduling.',
  'recommended'
FROM public.creator_leads WHERE handle = '@greenthumbmike' LIMIT 1;

INSERT INTO public.community_mentions (platform, author, content, url, sentiment) VALUES
  ('Reddit', 'u/plantpanic2024', 'My monstera is dying and I have no idea why. Yellow leaves, brown tips, the whole drama.', 'https://reddit.com/r/plantclinic/example1', 'frustrated'),
  ('Reddit', 'u/tomato_newbie', 'First time growing tomatoes in Texas heat. When should I water? Everything wilts by noon.', 'https://reddit.com/r/vegetablegardening/example2', 'curious'),
  ('X', '@balconygardener', 'Anyone know a good app for tracking plant watering? I keep killing my succulents.', 'https://x.com/example3', 'curious'),
  ('Threads', '@urbanjungle22', 'Just moved into a studio with ONE windowsill. What plants actually survive?', 'https://threads.net/example4', 'curious'),
  ('Facebook Groups', 'Sarah K.', 'Our community garden needs a better way to schedule volunteer watering shifts.', 'https://facebook.com/groups/example5', 'neutral');

INSERT INTO public.community_opportunities (
  platform, author, post, topic, question, sentiment, urgency_score, opportunity_score,
  opportunity_type, suggested_reply, status
) VALUES
  ('Reddit', 'u/plantpanic2024',
   'My monstera is dying and I have no idea why. Yellow leaves, brown tips, the whole drama.',
   'Monstera care', 'Why are my monstera leaves turning yellow with brown tips?',
   'frustrated', 92, 88, 'plant_problems',
   'Yellow leaves + brown tips usually means inconsistent watering — often overwatering with poor drainage. Check if the top 2 inches of soil are dry before watering again. A care schedule app can help you build the habit without guessing. Happy to share what worked for my monstera if helpful!',
   'pending'),
  ('Reddit', 'u/tomato_newbie',
   'First time growing tomatoes in Texas heat. When should I water? Everything wilts by noon.',
   'Texas gardening', 'When should I water tomatoes in extreme heat?',
   'curious', 85, 82, 'local_gardening',
   'In Texas heat, water early morning (before 8am) so roots absorb moisture before peak sun. Deep water 2-3x/week rather than daily shallow sprinkles. Mulch heavily around the base. Wilting at noon can be normal heat stress — check soil moisture before adding more water.',
   'pending'),
  ('X', '@balconygardener',
   'Anyone know a good app for tracking plant watering? I keep killing my succulents.',
   'Plant care apps', 'What app helps track plant watering?',
   'curious', 78, 90, 'beginner_questions',
   'Succulents need way less water than people think — usually every 2-3 weeks. A care tracker that reminds you based on each plant''s needs (not a generic schedule) makes a huge difference. What plants are you growing besides succulents?',
   'pending');

INSERT INTO public.community_reply_drafts (opportunity_id, platform, author, original_content, draft, status)
SELECT id, platform, author, post, suggested_reply, 'pending'
FROM public.community_opportunities
WHERE author IN ('u/plantpanic2024', 'u/tomato_newbie', '@balconygardener');

INSERT INTO public.agent_activity_log (agent_id, action, detail) VALUES
  ('scout', 'found_creator', 'Scout found creator: @gardenmomdaily — partnership score 91'),
  ('scout', 'scored_lead', 'Analyzed @greenthumbmike — audience fit 88, engagement 72'),
  ('scout', 'partnership_idea', 'Suggested partnership: 30-Day Tomato Challenge'),
  ('roots', 'found_discussion', 'Roots found discussion: "My monstera is dying."'),
  ('roots', 'drafted_reply', 'Drafted helpful reply for r/plantclinic thread — awaiting approval'),
  ('roots', 'found_opportunity', 'High-urgency opportunity on r/vegetablegardening — Texas heat watering');
