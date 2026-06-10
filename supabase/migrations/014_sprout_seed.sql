-- PlantPal Marketing OS — Phase 10 seed: Sprout publishing
-- Run AFTER 013_sprout_publishing.sql

-- Mark Sage-approved seed pieces as human-approved for Sprout queue
UPDATE public.bloom_content_pieces
SET status = 'approved'
WHERE id IN (
  'b2000000-0000-4000-8000-000000000004',
  'b2000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000010',
  'b2000000-0000-4000-8000-000000000011',
  'b2000000-0000-4000-8000-000000000007'
);

INSERT INTO public.sprout_scheduled_posts (
  id, bloom_piece_id, platform, title, hook, caption, cta,
  scheduled_at, recommended_time_label, best_time_score, status, schedule_approved, notes
) VALUES
  ('p1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000004', 'TikTok',
   'TikTok — watering schedule (1)',
   'Day in the life: fixing watering schedule in 60 seconds',
   'Concept: Visual story around watering schedule. Open on wilted plant, show PlantPal reminder, close on perked leaves.',
   'Link sticker: ''Fix my plant'' → PlantPal',
   NULL, 'Tue 7:00 PM EST — peak plant parent scroll', 88, 'waiting', FALSE,
   'Awaiting schedule approval — no auto-publish'),
  ('p1000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000001', 'X',
   'X — yellow leaves (1)',
   'Hot take: yellow leaves isn''t hard — you''re just missing this one signal.',
   'Yellow leaves keeps showing up in our community. Community thread: r/plantclinic panic posts.',
   'Track your plant''s care rhythm in PlantPal →',
   (CURRENT_DATE + INTERVAL '1 day')::date + TIME '09:00', 'Wed 9:00 AM EST — morning commute engagement', 82, 'ready', TRUE,
   'Schedule approved — ready for manual publish'),
  ('p1000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000010', 'X',
   'X — competitor differentiation (3)',
   '3 signs your plant identification app needs attention (most people ignore #2).',
   'Sentinel flagged competitor ID ads — differentiate on ongoing care, not just snapshots.',
   'Track your plant''s care rhythm in PlantPal →',
   (CURRENT_DATE - INTERVAL '2 days')::date + TIME '12:00', 'Mon 12:00 PM EST — lunch-break shares', 79, 'published', TRUE,
   'Manually published — tracked in performance'),
  ('p1000000-0000-4000-8000-000000000004', 'b2000000-0000-4000-8000-000000000011', 'TikTok',
   'TikTok — creator collab (2)',
   '"Plant parent check" — your first tomato of the season starts today',
   'Concept: Scout-inspired collab format with creator duet structure.',
   'Link sticker: ''Fix my plant'' → PlantPal',
   (CURRENT_DATE + INTERVAL '2 days')::date + TIME '19:00', 'Thu 7:00 PM EST — evening TikTok peak', 91, 'ready', TRUE,
   'High-priority slot — duet format'),
  ('p1000000-0000-4000-8000-000000000005', 'b2000000-0000-4000-8000-000000000007', 'Instagram',
   'Instagram — beginner mistakes (1)',
   'Swipe: 5-step beginner mistakes recovery guide',
   'Slide 1: Hook on common mistakes. Slides 2–4: diagnosis. Slide 5: PlantPal CTA.',
   'Slide 6: Download PlantPal — never guess watering again',
   NULL, 'Sat 10:00 AM EST — weekend save-and-plan window', 85, 'waiting', FALSE,
   'Carousel — schedule after human approval'),
  ('p1000000-0000-4000-8000-000000000006', NULL, 'Pinterest', 'Spring planting inspiration board',
   'Your first tomato of the season starts today',
   'Pin board: seed starting setup, tomato care timeline, harvest flex photos.',
   'Save for spring — PlantPal care plan link',
   (CURRENT_DATE + INTERVAL '3 days')::date + TIME '14:00', 'Sun 2:00 PM EST — planning & inspiration peak', 76, 'scheduling', FALSE,
   'Sprout assigning slot — awaiting final approval');

INSERT INTO public.agent_activity_log (agent_id, action, detail, metadata) VALUES
  ('sprout', 'waiting', '6 approved posts in publish queue — awaiting schedule approval', '{"waiting":2,"ready":2}'),
  ('sprout', 'scheduling', 'Recommending best posting times across Instagram, TikTok, X, Threads, Pinterest, YouTube', '{"platforms":6}'),
  ('sprout', 'ready', '2 posts schedule-approved — ready for manual publish (no auto-post)', '{"ready":2}'),
  ('sprout', 'published', '1 post marked published — performance tracking active', '{"published":1}');
