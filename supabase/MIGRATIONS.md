# Supabase migrations — run in order

Apply each file in **SQL Editor** before deploying to Vercel. Filenames are prefixed with execution order.

## Full list (001 → 046)

1. `001_marketing_os_schema.sql`
2. `002_marketing_os_seed.sql`
3. `003_creative_content_engine.sql`
4. `004_content_agent_system.sql`
5. `005_scout_roots_agents.sql`
6. `006_scout_roots_seed.sql`
7. `007_sentinel_competitor_intel.sql`
8. `008_sentinel_seed.sql`
9. `009_bloom_content_production.sql`
10. `010_bloom_seed.sql`
11. `011_sage_creative_director.sql`
12. `012_sage_seed.sql`
13. `013_sprout_publishing.sql`
14. `014_sprout_seed.sql`
15. `015_oak_partnership_manager.sql`
16. `016_oak_seed.sql`
17. `017_ivy_chief_of_staff.sql`
18. `018_ivy_seed.sql`
19. `019_atlas_head_of_growth.sql`
20. `020_atlas_seed.sql`
21. `021_fern_user_acquisition.sql`
22. `022_fern_seed.sql`
23. `023_echo_voice_of_customer.sql`
24. `024_echo_seed.sql`
25. `025_agent_collaboration.sql`
26. `026_agent_collaboration_seed.sql`
27. `027_agent_ai_workers.sql`
28. `028_agent_ai_workers_seed.sql`
29. `029_integrations_layer.sql`
30. `030_integrations_seed.sql`
31. `031_integrations_tables_fix.sql`
32. `032_hq_scout_roots_sentinel_fix.sql`
33. `033_agent_activity_log_fix.sql`
34. `034_master_hq_scout_roots_repair.sql`
35. `035_hq_remaining_tables_repair.sql`
36. `036_daily_report_system.sql`
37. `037_agent_worker_system.sql`
38. `038_phase24_agent_scheduler.sql`
39. `039_x_publish_readiness.sql`
40. `040_hq_workflow_events.sql`
41. `041_phase24_schedule_times.sql`
42. `042_phase25_agent_daily_briefs.sql`
43. `043_phase25_content_calendar.sql`
44. `044_phase26_automation.sql`
45. `045_phase26_discovery_items.sql`
46. `046_phase27_executive_daily_report.sql`
47. `047_phase28_pipeline_and_feedback.sql`
48. `048_phase29_missing_tables_and_assets.sql`
49. `049_phase29_reddit_automation.sql`

## If you already ran early migrations

Minimum repair set for current HQ features:

- `035_hq_remaining_tables_repair.sql`
- `036_daily_report_system.sql`
- `037_agent_worker_system.sql`
- `038_phase24_agent_scheduler.sql`
- `041_phase24_schedule_times.sql`
- `042_phase25_agent_daily_briefs.sql` — fixes "Could not find the table public.agent_daily_briefs"
- `043_phase25_content_calendar.sql` — Content Calendar (`/calendar`)
- `044_phase26_automation.sql` — Automation rules, runs, publishing packages, batch approvals (`/automation`)
- `045_phase26_discovery_items.sql` — fixes "Could not find the table public.discovery_items" (run after 042)
- `046_phase27_executive_daily_report.sql` — creates `daily_reports`/`workflow_runs`/`growth_action_items` if missing (replaces needing 036 first) and adds structured executive sections (content/growth reports, action plan, founder review)
- `047_phase28_pipeline_and_feedback.sql` — fixes "Could not find the table public.pipeline_content"; adds approval feedback columns to `approval_queue` (+ `revision_requested` status), `needs_revision` on `content_calendar`, and the `content_feedback` table (run after 042 + 043)
- `048_phase29_missing_tables_and_assets.sql` — fixes "Could not find the table public.ivy_briefs / public.agent_conversations / public.pipeline_content" (self-sufficient — also creates `ivy_recommendations`, `ivy_alerts`, `agent_profiles`, `agent_memory`, `agent_decisions`); adds `generated_assets` (image pipeline) and `generated_videos` (video packages); upgrades `content_feedback` with `content_id`/`content_type`/`agent_id`/`feedback_type`
- `049_phase29_reddit_automation.sql` — Reddit help-first automation: `reddit_accounts`, `reddit_opportunities`, `reddit_reply_drafts`, `reddit_publish_logs`, `reddit_safety_rules` (seeded with conservative limits: 5/day, 1/subreddit/day, no links, founder approval required)

## After running

Refresh PostgREST schema cache (included at end of recent migrations):

```sql
NOTIFY pgrst, 'reload schema';
```
