-- PlantPal Marketing OS — Phase 9 seed: Sage Creative Director reviews
-- Run AFTER 011_sage_creative_director.sql

-- Move existing bloom pieces into Sage review workflow
UPDATE public.bloom_content_pieces
SET status = 'awaiting_review'
WHERE status = 'pending'
  AND id NOT IN (
    SELECT bloom_piece_id FROM public.sage_content_reviews
  );

INSERT INTO public.sage_review_batches (
  id, run_date, status, pieces_reviewed, approved_count, rejected_count, avg_aggregate_score
) VALUES (
  's1000000-0000-4000-8000-000000000001',
  CURRENT_DATE,
  'completed',
  8, 5, 3, 82.4
);

INSERT INTO public.sage_content_reviews (
  id, batch_id, bloom_piece_id,
  originality_score, humor_score, emotional_impact_score, shareability_score, storytelling_score, educational_score,
  aggregate_score, recommendation, rejection_reason,
  hook_suggestion, cta_suggestion, storytelling_suggestion, creative_opportunity
) VALUES
  ('s2000000-0000-4000-8000-000000000001', 's1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000005',
   78, 72, 85, 80, 76, 82, 79, 'reject',
   'Reels concept lacks a distinctive visual hook — reads like generic plant care content.',
   'Open on the wilted succulent in harsh noon light, not a static before shot.',
   'Swap generic CTA for: ''Save this rescue timeline — link in bio''',
   'Structure as 3-beat story: mistake → intervention → payoff with time-lapse',
   'Repurpose as a ''plant ICU'' series — high save rate potential on Instagram'),
  ('s2000000-0000-4000-8000-000000000002', 's1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000004',
   84, 68, 88, 86, 82, 90, 86, 'approve', '',
   'Lead with ''Your plant isn''t dramatic — it''s dehydrated'' for stronger pattern interrupt.',
   'Use sticker CTA: ''Get my watering schedule'' instead of generic fix link',
   'Add voiceover beat: ''I set one reminder and stopped guessing''',
   'Turn into a recurring ''60-second plant ER'' format across TikTok + Shorts'),
  ('s2000000-0000-4000-8000-000000000003', 's1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001',
   82, 75, 90, 84, 78, 85, 82, 'approve', '',
   'Sharpen hook: ''Yellow leaves aren''t a mystery — they''re a message''',
   'End with ''Track the signal in PlantPal'' — ties urgency to product',
   'Thread format: 1 problem tweet → 3 diagnostic tweets → 1 CTA tweet',
   'Cross-post thread insights as a carousel for Instagram saves'),
  ('s2000000-0000-4000-8000-000000000004', 's1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000010',
   88, 70, 82, 92, 80, 78, 85, 'approve', '',
   'Keep competitor-angle hook — strong differentiation',
   'Add ''Compare your care stack'' CTA for competitive positioning',
   'Frame as ''what ID apps miss'' narrative arc',
   'Boost as paid social test — high shareability score'),
  ('s2000000-0000-4000-8000-000000000005', 's1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000011',
   90, 82, 86, 94, 88, 80, 87, 'approve', '',
   'Hook is strong — test duet-stitch variant with creator collab',
   'CTA: ''Duet this if you''ve killed a succulent'' — drives UGC',
   'Three-act: relatable fail → PlantPal fix → garden flex',
   'Highest viral potential in batch — prioritize production'),
  ('s2000000-0000-4000-8000-000000000006', 's1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000003',
   76, 65, 80, 74, 70, 88, 76, 'reject',
   'Thread opener is too broad — lacks a specific tension point.',
   'Start with ''I killed 3 plants before I learned this one thread''',
   'CTA buried — move PlantPal link to tweet 2, not tweet 8',
   'Use numbered tweets with one insight per slide — current outline is dense',
   'Extract tweet 3 as standalone X post for A/B test'),
  ('s2000000-0000-4000-8000-000000000007', 's1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000007',
   81, 60, 85, 79, 83, 92, 80, 'approve', '',
   'Carousel slide 1 needs a bolder stat: ''73% of beginners skip step 2''',
   'Final slide CTA: ''Build your cheat sheet in PlantPal''',
   'Visual story: problem slide → 3 fix slides → proof slide → CTA',
   'Offer as downloadable PDF lead magnet from blog post'),
  ('s2000000-0000-4000-8000-000000000008', 's1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000009',
   70, 55, 72, 68, 65, 75, 68, 'reject',
   'Email subject line is generic — no curiosity gap or personal stake.',
   'Subject: ''Your [plant name] has a schedule — here''s this week''s''',
   'Button CTA works — add pre-header text with one specific tip',
   'Open with a single plant story, not a generic weekly roundup',
   'Personalized subject lines could lift opens 15–20% — test with segment');

-- Sage-approved pieces enter human approval queue; rejected stay rejected
UPDATE public.bloom_content_pieces SET status = 'pending'
WHERE id IN (
  'b2000000-0000-4000-8000-000000000004',
  'b2000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000010',
  'b2000000-0000-4000-8000-000000000011',
  'b2000000-0000-4000-8000-000000000007'
);

UPDATE public.bloom_content_pieces SET status = 'rejected'
WHERE id IN (
  'b2000000-0000-4000-8000-000000000005',
  'b2000000-0000-4000-8000-000000000003',
  'b2000000-0000-4000-8000-000000000009'
);

INSERT INTO public.agent_activity_log (agent_id, action, detail, metadata) VALUES
  ('sage', 'reviewing', 'Reviewing 8 Bloom pieces — scoring originality, humor, emotion, shareability, storytelling, education', '{"batch":"seed"}'),
  ('sage', 'rejection', 'Rejected 3 pieces below 80 aggregate — rewrite suggestions generated', '{"rejected":3}'),
  ('sage', 'approval', 'Approved 5 pieces — routed to human approval queue', '{"approved":5}'),
  ('sage', 'review_complete', 'Review batch complete — avg score 82.4, 5 ready for Gate', '{"batch_id":"s1000000-0000-4000-8000-000000000001"}');
