-- PlantPal Marketing OS — Phase 8 seed: Bloom content production
-- Run AFTER 009_bloom_content_production.sql

INSERT INTO public.bloom_production_runs (
  id, run_date, status, pieces_generated, pieces_queued,
  scout_inputs, roots_inputs, sentinel_inputs, seasonal_inputs
) VALUES (
  'b1000000-0000-4000-8000-000000000001',
  CURRENT_DATE,
  'completed',
  15, 15, 3, 4, 2, 2
);

INSERT INTO public.bloom_content_pieces (
  id, run_id, format, platform, title, hook, caption, cta,
  viral_score, emotional_trigger, difficulty_score, source_type, source_detail,
  scheduled_date, status
) VALUES
  ('b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'x_post', 'X', 'X — yellow leaves (1)',
   'Hot take: yellow leaves isn''t hard — you''re just missing this one signal.',
   'Yellow leaves keeps showing up in our community. Community thread: r/plantclinic panic posts — PlantPal helps you act before it''s too late.',
   'Track your plant''s care rhythm in PlantPal →', 78, 'urgency', 38, 'roots_conversation', 'Community thread: yellow leaves panic', CURRENT_DATE, 'pending'),
  ('b2000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 'x_post', 'X', 'X — garden makeover (2)',
   'POV: you finally understand why your garden makeover keeps failing.',
   'Garden makeover trends from Scout creators — show the before, track the care, flex the after.',
   'Track your plant''s care rhythm in PlantPal →', 71, 'aspiration', 35, 'scout_discovery', 'Scout: garden transformation creators', CURRENT_DATE + 1, 'pending'),
  ('b2000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 'threads_post', 'Threads', 'Threads — houseplant care (1)',
   'Thread: everything I wish I knew about houseplant care before killing my third plant 🧵',
   'Houseplant care keeps showing up in our community. Spring planting kickoff season — PlantPal helps you act before it''s too late.',
   'Save the thread — link in bio for PlantPal free trial', 74, 'nostalgia', 40, 'seasonal_event', 'Spring planting kickoff: seed starting & soil prep', CURRENT_DATE, 'pending'),
  ('b2000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000001', 'tiktok_concept', 'TikTok', 'TikTok — watering schedule (1)',
   'Day in the life: fixing watering schedule in 60 seconds',
   'Concept: Visual story around watering schedule. Open on wilted plant, show PlantPal reminder, close on perked leaves.',
   'Link sticker: ''Fix my plant'' → PlantPal', 82, 'relief', 55, 'roots_conversation', 'Community: overwatering vs underwatering', CURRENT_DATE + 1, 'pending'),
  ('b2000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000001', 'reels_concept', 'Instagram', 'Instagram — succulent care (1)',
   'Before / after: succulent care rescue in one week',
   'Concept: Cinematic succulent rehab reel inspired by Sentinel competitor social growth signals.',
   'Comment ''CARE'' for the free care plan template', 76, 'pride', 52, 'sentinel_alert', 'Competitor signal: Blossom succulent reels trending', CURRENT_DATE + 1, 'approved'),
  ('b2000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000001', 'shorts_concept', 'YouTube', 'YouTube — tomato blossom end rot (1)',
   '60-sec fix: tomato blossom end rot explained like you''re five',
   'Concept: Quick science explainer with on-screen calcium fix checklist via PlantPal.',
   'Subscribe + try PlantPal — link below', 69, 'curiosity', 48, 'seasonal_event', 'Spring planting: tomato season prep', CURRENT_DATE + 2, 'pending'),
  ('b2000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000001', 'carousel', 'Instagram', 'Instagram — beginner mistakes (1)',
   'Swipe: 5-step beginner mistakes recovery guide',
   'Slide 1: Hook on common mistakes. Slides 2–4: diagnosis. Slide 5: PlantPal CTA.',
   'Slide 6: Download PlantPal — never guess watering again', 73, 'fear of failure', 44, 'roots_conversation', 'Community: beginner houseplant mistakes', CURRENT_DATE + 2, 'pending'),
  ('b2000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000001', 'blog_idea', 'Blog', 'Blog — sustainable gardening (1)',
   'The complete guide to sustainable gardening without the guilt',
   'Outline: intro → common mistakes → science-backed fixes → PlantPal workflow → checklist.',
   'CTA block: Start your free PlantPal garden journal', 65, 'belonging', 36, 'seasonal_event', 'Earth Month: sustainable gardening', CURRENT_DATE + 3, 'pending'),
  ('b2000000-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000001', 'email_idea', 'Email', 'Email — weekly care checklist (1)',
   'Subject: Your plant care checklist for this week',
   'Email body: personal opener, one actionable tip, community proof, soft CTA to PlantPal.',
   'Button: Open PlantPal → see your plant''s schedule', 61, 'urgency', 32, 'seasonal_event', 'Spring planting kickoff', CURRENT_DATE + 3, 'pending'),
  ('b2000000-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000001', 'x_post', 'X', 'X — competitor differentiation (3)',
   '3 signs your plant identification app needs attention (most people ignore #2).',
   'Sentinel flagged competitor ID ads — differentiate on ongoing care, not just snapshots.',
   'Track your plant''s care rhythm in PlantPal →', 80, 'surprise', 37, 'sentinel_alert', 'Competitor signal: PlantIn YouTube ads', CURRENT_DATE + 1, 'published'),
  ('b2000000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000001', 'tiktok_concept', 'TikTok', 'TikTok — creator collab (2)',
   '"Plant parent check" — your first tomato of the season starts today',
   'Concept: Scout-inspired collab format with creator duet structure.',
   'Link sticker: ''Fix my plant'' → PlantPal', 85, 'humor', 57, 'scout_discovery', 'Scout creator trend: garden humor', CURRENT_DATE + 2, 'published'),
  ('b2000000-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000001', 'reels_concept', 'Instagram', 'Instagram — repotting season (2)',
   'Stop scrolling if repotting season is on your worry list',
   'Concept: Quick repot checklist reel with PlantPal size tracker.',
   'Comment ''CARE'' for the free care plan template', 72, 'curiosity', 50, 'seasonal_event', 'Spring planting: repotting window', CURRENT_DATE + 3, 'pending'),
  ('b2000000-0000-4000-8000-000000000013', 'b1000000-0000-4000-8000-000000000001', 'threads_post', 'Threads', 'Threads — plant identification (2)',
   'I asked 500 plant parents about plant identification. Here''s what surprised me.',
   'Community data thread — ID is step one, care plan is the real unlock.',
   'Save the thread — link in bio for PlantPal free trial', 77, 'curiosity', 41, 'roots_conversation', 'Community: ID without care plan frustration', CURRENT_DATE + 1, 'pending'),
  ('b2000000-0000-4000-8000-000000000014', 'b1000000-0000-4000-8000-000000000001', 'shorts_concept', 'YouTube', 'YouTube — grow lights (2)',
   'Garden hack: your first tomato of the season starts today',
   'Concept: Grow light setup short with PlantPal light-hour logging.',
   'Subscribe + try PlantPal — link below', 68, 'aspiration', 46, 'scout_discovery', 'Scout: indoor grow setup creators', CURRENT_DATE + 2, 'pending'),
  ('b2000000-0000-4000-8000-000000000015', 'b1000000-0000-4000-8000-000000000001', 'carousel', 'Instagram', 'Instagram — pest patrol (2)',
   'Save this: pest patrol cheat sheet for beginners',
   'Slide carousel on aphids, spider mites, and neem routine with PlantPal pest log.',
   'Slide 6: Download PlantPal — never guess watering again', 70, 'fear of failure', 43, 'roots_conversation', 'Community: late summer pest panic', CURRENT_DATE + 3, 'pending');

INSERT INTO public.bloom_content_performance (
  content_piece_id, platform, impressions, engagements, clicks, shares, saves, notes
) VALUES
  ('b2000000-0000-4000-8000-000000000010', 'X', 12400, 890, 142, 67, 0, 'Strong CTR on competitor angle hook'),
  ('b2000000-0000-4000-8000-000000000011', 'TikTok', 48200, 4100, 890, 320, 540, 'Creator-style hook outperformed average'),
  ('b2000000-0000-4000-8000-000000000005', 'Instagram', 18600, 2200, 310, 145, 890, 'Carousel saves driving follow-on traffic');

INSERT INTO public.agent_activity_log (agent_id, action, detail, metadata) VALUES
  ('bloom', 'sourcing', 'Pulled inputs from Scout (3), Roots (4), Sentinel (2), seasonal calendar (2)', '{"scout":3,"roots":4,"sentinel":2,"seasonal":2}'),
  ('bloom', 'drafting', 'Generated 39 content pieces across 8 formats for daily batch', '{"formats":8}'),
  ('bloom', 'queueing', 'Queued 39 drafts to approval_queue — awaiting human sign-off', '{"queued":39}'),
  ('bloom', 'production_complete', 'Daily batch complete — 15 seed pieces loaded for demo', '{"run_id":"b1000000-0000-4000-8000-000000000001"}');
