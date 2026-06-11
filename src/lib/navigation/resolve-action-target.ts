/**
 * Phase 33 — every dashboard tile, brief action, approval bubble, and
 * workflow card that references work should resolve to a real destination.
 * Action objects carry these optional fields; resolveActionTarget() turns
 * them into a navigable href.
 */
export interface ActionTarget {
  target_route?: string;
  target_table?: string;
  target_id?: string;
  target_filter?: Record<string, string>;
  target_label?: string;
}

/** Maps source tables to the page where that work is reviewed. */
const TABLE_ROUTES: Record<string, string> = {
  approval_queue: "/approvals",
  content_calendar: "/calendar",
  community_opportunities: "/community",
  creators: "/creators",
  competitor_alerts: "/competitors",
  pipeline_content: "/blog-pipeline",
  seo_blog_posts: "/seo",
  reddit_reply_drafts: "/reddit",
  reddit_opportunities: "/reddit",
  generated_assets: "/images",
  generated_videos: "/video",
  creative_content_ideas: "/content",
  creative_projects: "/creative",
  batch_approvals: "/automation",
  company_workflows: "/company-os",
  agent_tasks: "/collaboration",
  ivy_briefs: "/agents/daily-brief",
};

/**
 * Resolve an action object into an href. Priority:
 * 1. explicit target_route
 * 2. target_table → known page (+ ?item=<id> deep link)
 * 3. null when the action has no destination (caller renders plain card)
 */
export function resolveActionTarget(action: ActionTarget | null | undefined): string | null {
  if (!action) return null;

  let base = action.target_route?.trim() || "";
  if (!base && action.target_table) {
    base = TABLE_ROUTES[action.target_table] ?? "";
  }
  if (!base) return null;

  const params = new URLSearchParams();
  // Preserve query strings already embedded in target_route
  const [path, existingQuery] = base.split("?");
  if (existingQuery) {
    for (const [key, value] of new URLSearchParams(existingQuery)) params.set(key, value);
  }
  if (action.target_id) params.set("item", action.target_id);
  if (action.target_filter) {
    for (const [key, value] of Object.entries(action.target_filter)) {
      if (value) params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/** Workflow health card ("Scout → Oak") → Company OS drawer deep link. */
export function workflowHealthHref(workflowName: string): string {
  return `/company-os?workflow=${encodeURIComponent(workflowName)}`;
}
