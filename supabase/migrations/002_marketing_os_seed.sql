-- PlantPal Marketing OS — Sample seed data
-- Run AFTER 001_marketing_os_schema.sql

-- Clear existing seed (safe re-run)
TRUNCATE public.approval_queue, public.competitor_alerts, public.partnerships,
  public.creators, public.reply_drafts, public.community_opportunities,
  public.video_scripts, public.image_prompts, public.social_posts,
  public.content_ideas CASCADE;

-- content_ideas
INSERT INTO public.content_ideas (title, format, hook, body, status) VALUES
('5 beginner plant mistakes that kill your garden', 'tiktok', 'Stop killing your plants — you''re probably making mistake #3.', 'Quick cuts showing overwatering, wrong light, skipping drainage holes, repotting too early, and ignoring humidity. End with PlantPal scan demo.', 'approved'),
('Monstera care in 60 seconds', 'reels', 'Your monstera isn''t dramatic — it''s telling you something.', 'Cover watering schedule, fenestration tips, moss pole setup, and when to fertilize. Soft CTA to try PlantPal''s care reminders.', 'pending'),
('Spring garden reset checklist', 'carousel', 'Spring reset checklist every gardener needs 🌱', '10-slide carousel: prune, repot, soil refresh, pest check, fertilize, rotate plants, clean leaves, update care schedule, plan new additions, track in PlantPal.', 'draft'),
('Why yellow leaves aren''t always bad', 'blog', 'Before you panic about yellow leaves, read this.', 'Educational blog covering natural aging vs. overwatering vs. nutrient deficiency. Include decision tree graphic and link to PlantPal diagnosis.', 'pending'),
('Plant parent morning routine', 'instagram', 'My 10-minute plant parent morning routine ☀️', 'Aesthetic morning routine: check soil moisture, rotate plants, mist tropicals, log care in PlantPal, enjoy coffee with the jungle.', 'approved'),
('PlantPal vs guessing — side by side', 'x', 'Guessing: ''maybe it needs water?'' PlantPal: ''Water in 2 days. Soil is 60% dry.''', 'Thread comparing guesswork vs data-driven care. 4 tweets with screenshots and a poll.', 'draft');

-- social_posts
INSERT INTO public.social_posts (platform, caption, hashtags, status) VALUES
('Instagram', 'Yellow leaves? Don''t panic yet. 🍃 Sometimes it''s natural aging, sometimes it''s a cry for help. Swipe for our quick diagnosis guide — and save this for plant ER moments.', ARRAY['#PlantCare', '#PlantParent', '#MonsteraMonday', '#PlantPal'], 'approved'),
('TikTok', 'POV: You finally found an app that tells you WHEN to water, not just IF 😭🌱 #planttok #plantcare #plantparent', ARRAY['#planttok', '#plantcare', '#plantparent', '#gardentok'], 'pending'),
('X', 'Hot take: Most plant deaths are from kindness, not neglect. Overwatering > underwatering, every time. What''s the #1 mistake you made as a beginner?', ARRAY['#PlantTwitter', '#HousePlants'], 'draft');

-- image_prompts
INSERT INTO public.image_prompts (title, category, prompt, style, status) VALUES
('Spring planting hero graphic', 'social_graphic', 'Minimalist social media graphic, soft sage green (#95B89B) background, single terracotta pot with young seedling, clean typography space on right third, warm natural light, editorial plant photography style, 1080x1080', 'Editorial minimal', 'approved'),
('PlantPal care reminder screenshot', 'app_screenshot', 'Mobile app screenshot mockup showing plant care dashboard with watering reminder, health score ring at 87%, monstera plant card, clean UI with forest green (#2D6A4F) accents on off-white (#FAFBF8) background, iPhone 15 frame', 'Product UI', 'pending'),
('Tomato leaf deficiency chart', 'educational', 'Educational infographic showing 4 tomato leaf conditions: nitrogen deficiency (pale yellow), overwatering (yellow with brown edges), sun scorch (crispy brown), healthy (deep green). Labeled diagram style, botanical illustration meets modern flat design', 'Educational infographic', 'approved'),
('Balcony garden transformation', 'before_after', 'Split-screen before/after of small apartment balcony garden. Before: empty concrete with one sad succulent. After: lush vertical garden with herbs, trailing pothos, string lights, cozy seating. Golden hour lighting, aspirational but realistic', 'Lifestyle photography', 'draft');

-- video_scripts
INSERT INTO public.video_scripts (title, platform, hook, scenes, on_screen_text, voiceover, cta, status) VALUES
('Why your tomato leaves are yellow', 'TikTok', 'Your tomato leaves are yellow and it''s NOT always bad news.',
 '[{"label":"Scene 1","description":"Close-up of yellowing tomato leaves, concerned face"},{"label":"Scene 2","description":"Split screen: bottom leaves yellow (normal) vs all leaves yellow (problem)"},{"label":"Scene 3","description":"Quick tips: check soil moisture, look for spots, check nitrogen"},{"label":"Scene 4","description":"PlantPal scan demo identifying issue"}]'::jsonb,
 ARRAY['Yellow leaves? 🍅', 'Bottom leaves = normal', 'All leaves = check this', 'Scan with PlantPal'],
 'If only the bottom leaves are yellow, your plant is probably just aging. But if everything''s turning yellow? Check your watering first — soggy soil is the #1 culprit. Snap a photo in PlantPal and we''ll help you figure it out.',
 'Link in bio — grow with confidence 🌱', 'approved'),
('Plant parent morning routine', 'Instagram', 'The 10-minute routine that saved my 47 plants.',
 '[{"label":"Scene 1","description":"Wake up, walk to plant shelf with coffee"},{"label":"Scene 2","description":"Check soil with finger test on 3 plants"},{"label":"Scene 3","description":"Open PlantPal, review today''s care tasks"},{"label":"Scene 4","description":"Mist tropicals, rotate pothos toward light"},{"label":"Scene 5","description":"Satisfied plant parent moment, lush shelf reveal"}]'::jsonb,
 ARRAY['10-min plant routine', 'Check soil ✓', 'Review tasks ✓', '47 plants thriving'],
 'I used to either neglect my plants or smother them. Now I spend 10 minutes each morning checking what actually needs attention. PlantPal tells me who needs water today so I''m not guessing.',
 'Try PlantPal free — link in bio', 'pending');

-- community_opportunities
INSERT INTO public.community_opportunities (platform, author, post, topic, urgency_score, suggested_reply, status) VALUES
('Reddit', 'u/garden_newbie_22', 'Why are my tomato leaves yellow? I water every day and they keep getting worse.', 'Plant diagnosis', 92, 'Yellow leaves with daily watering often means too much water — tomato roots need to dry out between waterings. Try checking the top 2 inches of soil before watering. If it''s still moist, wait another day.', 'pending'),
('X', '@plantcurious', 'What plant app should I use? Tried two and they both just tell me to water randomly.', 'App recommendation', 88, 'Look for apps that factor in your specific plant, pot size, light conditions, and season — not just generic schedules. PlantPal does personalized care reminders based on your setup.', 'pending'),
('Facebook', 'Sarah M.', 'My monstera is dying 😭 leaves turning brown and crispy. I''ve tried everything!', 'Monstera care', 85, 'Brown crispy edges on monstera often point to low humidity or inconsistent watering. They''re tropical plants — they love humidity above 50%. Try a pebble tray or grouping it with other plants.', 'pending'),
('Reddit', 'u/indoor_jungle_dreams', 'Best plants for beginners? I kill everything but want to try again.', 'Beginner recommendations', 75, 'Pothos, snake plant, and ZZ plant are nearly indestructible starters. Start with one plant, learn its rhythm for 2-3 weeks, then add another.', 'approved'),
('Threads', '@balcony_bloom', 'Anyone else overwhelmed by conflicting plant advice online?', 'Care confusion', 70, 'Totally valid frustration — generic advice ignores YOUR conditions. Light, pot size, humidity, and season all change the answer.', 'pending');

-- reply_drafts
INSERT INTO public.reply_drafts (platform, original_post, draft, status) VALUES
('Reddit', 'Why are my tomato leaves yellow? I water every day...', 'Yellow leaves with daily watering often means too much water — tomato roots need to dry out between waterings. Try the finger test: if the top 2 inches are still moist, skip today.', 'pending'),
('X', 'What plant app should I use? Tried two and they both just tell me to water randomly.', 'Worth looking for apps that personalize to your plant + environment, not just generic timers. Things like pot size, light level, and season matter a lot.', 'pending'),
('Facebook', 'My monstera is dying 😭 leaves turning brown and crispy.', 'Brown crispy edges usually mean low humidity or too much direct sun. Monsteras love bright indirect light and 50%+ humidity. A pebble tray or grouping with other plants can help.', 'approved'),
('Instagram', 'Comment on our post: ''Does this work for outdoor plants too?''', 'Great question! PlantPal works for outdoor container plants too — you''ll set your location and the app adjusts care recommendations for your climate zone.', 'rejected');

-- creators
INSERT INTO public.creators (name, platform, niche, followers, engagement_rate, email, status, notes, partnership_idea) VALUES
('Urban Jungle Diaries', 'Instagram', 'Indoor jungle / apartment gardening', 284000, 4.20, 'hello@urbanjunglediaries.com', 'contacted', 'Replied to outreach email. Interested in affiliate partnership.', 'Sponsored reel series: ''How I care for 80+ plants'' featuring PlantPal'),
('Garden Marcus', 'TikTok', 'Beginner gardening / edible plants', 512000, 6.80, 'marcus@gardenmarcus.co', 'prospect', 'High engagement on tomato/garden content. No outreach yet.', 'Co-create ''First garden'' series with PlantPal care tracking'),
('The Sill', 'Instagram', 'Plant shop / lifestyle', 890000, 2.10, 'partnerships@thesill.com', 'negotiating', 'In talks for co-branded care guide content.', 'Cross-promotion: PlantPal care app + The Sill plant bundles'),
('Plant Daddy Al', 'YouTube', 'Plant care education / reviews', 156000, 5.50, 'al@plantdaddyal.com', 'partnered', 'Published review video. 12K views in first week.', 'Ongoing affiliate + quarterly feature updates'),
('Balcony Botanist', 'YouTube', 'Small space / balcony gardening', 89000, 7.20, 'contact@balconybotanist.com', 'prospect', 'Perfect audience overlap. Small but highly engaged.', 'Sponsored ''Balcony garden setup'' video with PlantPal integration');

-- partnerships
INSERT INTO public.partnerships (name, type, contact, location, status, notes, opportunity) VALUES
('GreenThumb Nursery', 'nursery', 'sarah@greenthumbnursery.com', 'Portland, OR', 'in_discussion', 'Local nursery chain with 4 locations. Interested in QR codes on plant tags.', 'Co-branded plant tags linking to PlantPal care guides'),
('Botanical Garden of Brooklyn', 'botanical_garden', 'events@bbgarden.org', 'Brooklyn, NY', 'lead', 'Annual plant sale attracts 10K+ visitors. Sponsorship opportunity.', 'Sponsor spring plant sale + demo booth with PlantPal scans'),
('Terrain Landscapes', 'landscaper', 'mike@terrainlandscapes.com', 'Austin, TX', 'active', 'Recommends PlantPal to new clients for ongoing care.', 'Referral program — landscaper gets commission per signup'),
('Burpee Seeds', 'seed_company', 'partnerships@burpee.com', 'Warminster, PA', 'lead', 'Large seed catalog audience. Potential seed packet insert partnership.', 'QR code on seed packets → PlantPal growing guide'),
('West Elm Home', 'home_garden_brand', 'brand@westelm.com', 'New York, NY', 'in_discussion', 'Exploring plant + planter bundle with digital care companion.', 'PlantPal included with premium planter purchases'),
('Sunshine Garden Center', 'garden_center', 'owner@sunshinegarden.com', 'Denver, CO', 'active', 'Running in-store PlantPal demo tablets. 340 signups in month 1.', 'Expand to all 3 locations + staff training program');

-- competitor_alerts
INSERT INTO public.competitor_alerts (competitor, type, title, description, severity) VALUES
('Planta', 'new_feature', 'AI watering reminders launched', 'Planta rolled out Smart Water that adjusts schedules based on weather data. Getting positive App Store reviews.', 'high'),
('PictureThis', 'viral_post', 'TikTok identification challenge hits 2M views', 'PictureThis #WhatPlantIsThis challenge trending on TikTok with celebrity participation.', 'medium'),
('Greg', 'app_store_ranking', 'Greg moved to #3 in Lifestyle category', 'Greg climbed 12 positions in the US App Store Lifestyle charts this week.', 'medium'),
('PlantIn', 'new_ad', 'Aggressive Facebook ad campaign detected', 'PlantIn running $1 first month ads targeting plant parent demographics. Estimated $15K/day spend.', 'high'),
('Blossom', 'negative_reviews', 'Review trend: subscription too expensive', 'Blossom seeing spike in 1-star reviews mentioning pricing. 23% of last 50 reviews mention cost.', 'low'),
('PlantNet', 'new_feature', 'Community identification feature added', 'PlantNet added crowdsourced plant ID with expert verification. Popular in European markets.', 'low');

-- approval_queue
INSERT INTO public.approval_queue (type, channel, draft, status) VALUES
('social_post', 'TikTok', 'POV: You finally found an app that tells you WHEN to water, not just IF 😭🌱', 'pending'),
('reply', 'Reddit', 'Yellow leaves with daily watering often means too much water — try the finger test on the top 2 inches of soil.', 'pending'),
('content', 'Instagram', 'Monstera care in 60 seconds — Your monstera isn''t dramatic, it''s telling you something.', 'pending'),
('video_script', 'TikTok', 'Why your tomato leaves are yellow — hook + 4-scene breakdown with PlantPal CTA', 'approved'),
('image_prompt', 'Instagram', 'Spring planting hero graphic — minimalist sage green background, terracotta pot, editorial style', 'approved'),
('reply', 'X', 'Worth looking for apps that personalize to your plant + environment, not just generic timers.', 'pending'),
('social_post', 'X', 'Hot take: Most plant deaths are from kindness, not neglect. Overwatering > underwatering.', 'pending'),
('content', 'Blog', 'Why yellow leaves aren''t always bad — educational post with decision tree graphic', 'pending');
