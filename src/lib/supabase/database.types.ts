export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

/**
 * Phase 34 — source attribution columns (migration 056).
 * Optional so reads stay graceful before the migration is applied.
 */
type SourceColumns = {
  source_url?: string;
  source_author?: string;
  source_author_url?: string;
  source_platform?: string;
  source_title?: string;
  source_subreddit?: string;
  source_created_at?: string | null;
  engagement?: Json;
  data_source?: string;
};

export interface Database {
  public: {
    Tables: {
      content_ideas: TableDef<
        {
          id: string;
          title: string;
          format: string;
          hook: string;
          body: string;
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title: string;
          format: string;
          hook?: string;
          body?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          title?: string;
          format?: string;
          hook?: string;
          body?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      creative_content_ideas: TableDef<
        {
          id: string;
          title: string;
          content_type: string;
          format: string;
          hook: string;
          emotional_trigger: string;
          why_it_works: string;
          cta: string;
          difficulty_score: number;
          viral_score: number;
          body: string;
          status: string;
          generation_batch_id: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title: string;
          content_type: string;
          format: string;
          hook?: string;
          emotional_trigger?: string;
          why_it_works?: string;
          cta?: string;
          difficulty_score?: number;
          viral_score?: number;
          body?: string;
          status?: string;
          generation_batch_id?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          title?: string;
          content_type?: string;
          format?: string;
          hook?: string;
          emotional_trigger?: string;
          why_it_works?: string;
          cta?: string;
          difficulty_score?: number;
          viral_score?: number;
          body?: string;
          status?: string;
          generation_batch_id?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      social_posts: TableDef<
        {
          id: string;
          platform: string;
          caption: string;
          hashtags: string[];
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          platform: string;
          caption?: string;
          hashtags?: string[];
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          platform?: string;
          caption?: string;
          hashtags?: string[];
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      image_prompts: TableDef<
        {
          id: string;
          title: string;
          category: string;
          prompt: string;
          style: string;
          status: string;
          source_table: string;
          source_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title: string;
          category: string;
          prompt?: string;
          style?: string;
          status?: string;
          source_table?: string;
          source_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          title?: string;
          category?: string;
          prompt?: string;
          style?: string;
          status?: string;
          source_table?: string;
          source_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      video_scripts: TableDef<
        {
          id: string;
          title: string;
          platform: string;
          hook: string;
          scenes: Json;
          on_screen_text: string[];
          voiceover: string;
          cta: string;
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title: string;
          platform: string;
          hook?: string;
          scenes?: Json;
          on_screen_text?: string[];
          voiceover?: string;
          cta?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          title?: string;
          platform?: string;
          hook?: string;
          scenes?: Json;
          on_screen_text?: string[];
          voiceover?: string;
          cta?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      community_opportunities: TableDef<
        {
          id: string;
          platform: string;
          author: string;
          post: string;
          topic: string;
          question: string;
          sentiment: string;
          urgency_score: number;
          opportunity_score: number;
          opportunity_type: string;
          suggested_reply: string;
          mention_id: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        } & SourceColumns,
        {
          id?: string;
          platform: string;
          author?: string;
          post?: string;
          topic?: string;
          question?: string;
          sentiment?: string;
          urgency_score?: number;
          opportunity_score?: number;
          opportunity_type?: string;
          suggested_reply?: string;
          mention_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        } & SourceColumns,
        {
          id?: string;
          platform?: string;
          author?: string;
          post?: string;
          topic?: string;
          question?: string;
          sentiment?: string;
          urgency_score?: number;
          opportunity_score?: number;
          opportunity_type?: string;
          suggested_reply?: string;
          mention_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        } & SourceColumns
      >;
      reply_drafts: TableDef<
        {
          id: string;
          platform: string;
          original_post: string;
          draft: string;
          status: string;
          created_at: string;
          updated_at: string;
        } & SourceColumns,
        {
          id?: string;
          platform: string;
          original_post?: string;
          draft?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        } & SourceColumns,
        {
          id?: string;
          platform?: string;
          original_post?: string;
          draft?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        } & SourceColumns
      >;
      creators: TableDef<
        {
          id: string;
          name: string;
          platform: string;
          niche: string;
          followers: number;
          engagement_rate: number;
          email: string;
          status: string;
          notes: string;
          partnership_idea: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          name: string;
          platform: string;
          niche?: string;
          followers?: number;
          engagement_rate?: number;
          email?: string;
          status?: string;
          notes?: string;
          partnership_idea?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          name?: string;
          platform?: string;
          niche?: string;
          followers?: number;
          engagement_rate?: number;
          email?: string;
          status?: string;
          notes?: string;
          partnership_idea?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      partnerships: TableDef<
        {
          id: string;
          name: string;
          type: string;
          contact: string;
          location: string;
          status: string;
          notes: string;
          opportunity: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          name: string;
          type: string;
          contact?: string;
          location?: string;
          status?: string;
          notes?: string;
          opportunity?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          name?: string;
          type?: string;
          contact?: string;
          location?: string;
          status?: string;
          notes?: string;
          opportunity?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      competitor_alerts: TableDef<
        {
          id: string;
          competitor: string;
          type: string;
          title: string;
          description: string;
          severity: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          competitor: string;
          type: string;
          title: string;
          description?: string;
          severity?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          competitor?: string;
          type?: string;
          title?: string;
          description?: string;
          severity?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      approval_queue: TableDef<
        {
          id: string;
          type: string;
          channel: string;
          draft: string;
          status: string;
          source_id: string | null;
          created_at: string;
          updated_at: string;
          // Phase 28 — approval feedback (optional until migration 047 runs)
          approval_feedback?: string;
          rejection_reason?: string;
          revision_notes?: string;
          approved_by?: string;
          approved_at?: string | null;
          rejected_at?: string | null;
          sent_back_to_agent?: string;
          feedback_category?: string;
          // Phase 33 — source context (optional until migration 054 runs)
          source_platform?: string;
          source_url?: string;
          source_author?: string;
          source_author_url?: string;
          source_title?: string;
          source_excerpt?: string;
          data_source?: string;
          title?: string;
          summary?: string;
          payload?: Json;
          source_trace?: Json;
          assigned_agent?: string;
          destination?: string;
        },
        {
          id?: string;
          type: string;
          channel?: string;
          draft?: string;
          status?: string;
          source_id?: string | null;
          created_at?: string;
          updated_at?: string;
          approval_feedback?: string;
          rejection_reason?: string;
          revision_notes?: string;
          approved_by?: string;
          approved_at?: string | null;
          rejected_at?: string | null;
          sent_back_to_agent?: string;
          source_platform?: string;
          source_url?: string;
          source_author?: string;
          source_author_url?: string;
          source_title?: string;
          source_excerpt?: string;
          data_source?: string;
          title?: string;
          summary?: string;
          payload?: Json;
          source_trace?: Json;
          assigned_agent?: string;
          destination?: string;
          feedback_category?: string;
        },
        {
          id?: string;
          type?: string;
          channel?: string;
          draft?: string;
          status?: string;
          source_id?: string | null;
          approval_feedback?: string;
          rejection_reason?: string;
          revision_notes?: string;
          approved_by?: string;
          approved_at?: string | null;
          rejected_at?: string | null;
          sent_back_to_agent?: string;
          feedback_category?: string;
          title?: string;
          summary?: string;
          payload?: Json;
          source_trace?: Json;
          assigned_agent?: string;
          destination?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      agent_daily_briefs: TableDef<
        {
          id: string;
          brief_date: string;
          title: string;
          summary: string;
          agent_productivity: Json;
          workflow_summary: Json;
          api_usage_summary: Json;
          analytics_summary: Json;
          recommendations: Json;
          created_by_agent: string;
          run_date: string;
          status: string;
          discovery_summary: string;
          content_count: number;
          approved_count: number;
          rejected_count: number;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          brief_date?: string;
          title?: string;
          summary?: string;
          agent_productivity?: Json;
          workflow_summary?: Json;
          api_usage_summary?: Json;
          analytics_summary?: Json;
          recommendations?: Json;
          created_by_agent?: string;
          run_date?: string;
          status?: string;
          discovery_summary?: string;
          content_count?: number;
          approved_count?: number;
          rejected_count?: number;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          brief_date?: string;
          title?: string;
          summary?: string;
          agent_productivity?: Json;
          workflow_summary?: Json;
          api_usage_summary?: Json;
          analytics_summary?: Json;
          recommendations?: Json;
          created_by_agent?: string;
          run_date?: string;
          status?: string;
          discovery_summary?: string;
          content_count?: number;
          approved_count?: number;
          rejected_count?: number;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      content_feedback: TableDef<
        {
          id: string;
          source_table: string;
          source_id: string | null;
          calendar_item_id: string | null;
          content_id: string | null;
          content_type: string;
          agent_id: string;
          feedback_type: string;
          decision: string;
          feedback_category: string;
          feedback_text: string;
          sent_back_to_agent: string;
          created_by: string;
          created_at: string;
        },
        {
          id?: string;
          source_table?: string;
          source_id?: string | null;
          calendar_item_id?: string | null;
          content_id?: string | null;
          content_type?: string;
          agent_id?: string;
          feedback_type?: string;
          decision?: string;
          feedback_category?: string;
          feedback_text?: string;
          sent_back_to_agent?: string;
          created_by?: string;
          created_at?: string;
        },
        {
          id?: string;
          decision?: string;
          feedback_category?: string;
          feedback_text?: string;
          sent_back_to_agent?: string;
        }
      >;
      generated_assets: TableDef<
        {
          id: string;
          prompt_id: string | null;
          calendar_item_id: string | null;
          platform: string;
          asset_type: string;
          image_url: string;
          thumbnail_url: string;
          generation_provider: string;
          generation_model: string;
          prompt: string;
          status: string;
          review_feedback: string;
          revision_notes: string;
          selected: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          prompt_id?: string | null;
          calendar_item_id?: string | null;
          platform?: string;
          asset_type?: string;
          image_url?: string;
          thumbnail_url?: string;
          generation_provider?: string;
          generation_model?: string;
          prompt?: string;
          status?: string;
          review_feedback?: string;
          revision_notes?: string;
          selected?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          prompt_id?: string | null;
          calendar_item_id?: string | null;
          platform?: string;
          asset_type?: string;
          image_url?: string;
          thumbnail_url?: string;
          generation_provider?: string;
          generation_model?: string;
          prompt?: string;
          status?: string;
          review_feedback?: string;
          revision_notes?: string;
          selected?: boolean;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      generated_videos: TableDef<
        {
          id: string;
          script_id: string | null;
          calendar_item_id: string | null;
          platform: string;
          video_url: string;
          thumbnail_url: string;
          script: string;
          hook: string;
          scenes: Json;
          voiceover: string;
          on_screen_text: Json;
          caption: string;
          cta: string;
          status: string;
          review_feedback: string;
          revision_notes: string;
          generation_provider: string;
          generation_model: string;
          // Phase 34 (migration 055) — optional until applied
          job_id?: string;
          error_message?: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          script_id?: string | null;
          calendar_item_id?: string | null;
          platform?: string;
          video_url?: string;
          thumbnail_url?: string;
          script?: string;
          hook?: string;
          scenes?: Json;
          voiceover?: string;
          on_screen_text?: Json;
          caption?: string;
          cta?: string;
          status?: string;
          review_feedback?: string;
          revision_notes?: string;
          generation_provider?: string;
          generation_model?: string;
          job_id?: string;
          error_message?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          script_id?: string | null;
          calendar_item_id?: string | null;
          platform?: string;
          video_url?: string;
          thumbnail_url?: string;
          script?: string;
          hook?: string;
          scenes?: Json;
          voiceover?: string;
          on_screen_text?: Json;
          caption?: string;
          cta?: string;
          status?: string;
          review_feedback?: string;
          revision_notes?: string;
          generation_provider?: string;
          generation_model?: string;
          job_id?: string;
          error_message?: string;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      reddit_accounts: TableDef<
        {
          id: string;
          username: string;
          status: string;
          karma: number;
          account_age_days: number;
          monitored_subreddits: string[];
          rate_limit_remaining: number;
          last_checked_at: string | null;
          notes: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          username?: string;
          status?: string;
          karma?: number;
          account_age_days?: number;
          monitored_subreddits?: string[];
          rate_limit_remaining?: number;
          last_checked_at?: string | null;
          notes?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          username?: string;
          status?: string;
          karma?: number;
          account_age_days?: number;
          monitored_subreddits?: string[];
          rate_limit_remaining?: number;
          last_checked_at?: string | null;
          notes?: string;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      reddit_opportunities: TableDef<
        {
          id: string;
          subreddit: string;
          post_id: string;
          permalink: string;
          author: string;
          title: string;
          question: string;
          risk_score: number;
          status: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          subreddit?: string;
          post_id?: string;
          permalink?: string;
          author?: string;
          title?: string;
          question?: string;
          risk_score?: number;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          subreddit?: string;
          post_id?: string;
          permalink?: string;
          author?: string;
          title?: string;
          question?: string;
          risk_score?: number;
          status?: string;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      reddit_reply_drafts: TableDef<
        {
          id: string;
          opportunity_id: string | null;
          subreddit: string;
          post_id: string;
          comment_id: string;
          permalink: string;
          author: string;
          question: string;
          draft_reply: string;
          approved_reply: string;
          status: string;
          risk_score: number;
          review_feedback: string;
          posted_at: string | null;
          published_url: string;
          error_message: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          opportunity_id?: string | null;
          subreddit?: string;
          post_id?: string;
          comment_id?: string;
          permalink?: string;
          author?: string;
          question?: string;
          draft_reply?: string;
          approved_reply?: string;
          status?: string;
          risk_score?: number;
          review_feedback?: string;
          posted_at?: string | null;
          published_url?: string;
          error_message?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          opportunity_id?: string | null;
          subreddit?: string;
          post_id?: string;
          comment_id?: string;
          permalink?: string;
          author?: string;
          question?: string;
          draft_reply?: string;
          approved_reply?: string;
          status?: string;
          risk_score?: number;
          review_feedback?: string;
          posted_at?: string | null;
          published_url?: string;
          error_message?: string;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      reddit_publish_logs: TableDef<
        {
          id: string;
          draft_id: string | null;
          subreddit: string;
          post_id: string;
          comment_id: string;
          permalink: string;
          action: string;
          status: string;
          published_url: string;
          error_message: string;
          rate_limit_remaining: number | null;
          upvotes: number;
          engagement_note: string;
          reply_url: string;
          metadata: Json;
          created_at: string;
        },
        {
          id?: string;
          draft_id?: string | null;
          subreddit?: string;
          post_id?: string;
          comment_id?: string;
          permalink?: string;
          action?: string;
          status?: string;
          published_url?: string;
          error_message?: string;
          rate_limit_remaining?: number | null;
          upvotes?: number;
          engagement_note?: string;
          reply_url?: string;
          metadata?: Json;
          created_at?: string;
        },
        {
          id?: string;
          status?: string;
          published_url?: string;
          error_message?: string;
          upvotes?: number;
          engagement_note?: string;
          reply_url?: string;
        }
      >;
      reddit_safety_rules: TableDef<
        {
          id: string;
          rule_key: string;
          rule_label: string;
          rule_value: string;
          enabled: boolean;
          notes: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          rule_key: string;
          rule_label?: string;
          rule_value?: string;
          enabled?: boolean;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          rule_key?: string;
          rule_label?: string;
          rule_value?: string;
          enabled?: boolean;
          notes?: string;
          updated_at?: string;
        }
      >;
      company_workflows: TableDef<
        {
          id: string;
          workflow_type: string;
          workflow_name: string;
          status: string;
          priority: string;
          source_agent: string;
          current_agent: string;
          next_agent: string;
          trigger_id: string;
          started_at: string;
          completed_at: string | null;
          blocked_at: string | null;
          blocker_reason: string;
          outcome: string;
          impact_score: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          workflow_type?: string;
          workflow_name?: string;
          status?: string;
          priority?: string;
          source_agent?: string;
          current_agent?: string;
          next_agent?: string;
          trigger_id?: string;
          started_at?: string;
          completed_at?: string | null;
          blocked_at?: string | null;
          blocker_reason?: string;
          outcome?: string;
          impact_score?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          workflow_name?: string;
          status?: string;
          priority?: string;
          current_agent?: string;
          next_agent?: string;
          completed_at?: string | null;
          blocked_at?: string | null;
          blocker_reason?: string;
          outcome?: string;
          impact_score?: number;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      workflow_steps: TableDef<
        {
          id: string;
          workflow_id: string;
          step_order: number;
          step_name: string;
          agent_id: string;
          status: string;
          started_at: string;
          completed_at: string | null;
          input_summary: string;
          output_summary: string;
          blocker_reason: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          workflow_id: string;
          step_order?: number;
          step_name?: string;
          agent_id?: string;
          status?: string;
          started_at?: string;
          completed_at?: string | null;
          input_summary?: string;
          output_summary?: string;
          blocker_reason?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          step_name?: string;
          status?: string;
          completed_at?: string | null;
          input_summary?: string;
          output_summary?: string;
          blocker_reason?: string;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      company_outputs: TableDef<
        {
          id: string;
          workflow_id: string | null;
          agent_id: string;
          output_type: string;
          title: string;
          summary: string;
          source_table: string;
          source_id: string;
          target_table: string;
          target_id: string;
          status: string;
          risk_level: string;
          approval_required: boolean;
          published_url: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          workflow_id?: string | null;
          agent_id?: string;
          output_type?: string;
          title?: string;
          summary?: string;
          source_table?: string;
          source_id?: string;
          target_table?: string;
          target_id?: string;
          status?: string;
          risk_level?: string;
          approval_required?: boolean;
          published_url?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          status?: string;
          risk_level?: string;
          approval_required?: boolean;
          published_url?: string;
          target_table?: string;
          target_id?: string;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      company_decisions: TableDef<
        {
          id: string;
          workflow_id: string | null;
          decision_type: string;
          decision_maker: string;
          decision: string;
          reason: string;
          feedback: string;
          impact_score: number;
          created_at: string;
        },
        {
          id?: string;
          workflow_id?: string | null;
          decision_type?: string;
          decision_maker?: string;
          decision?: string;
          reason?: string;
          feedback?: string;
          impact_score?: number;
          created_at?: string;
        },
        {
          id?: string;
          decision?: string;
          reason?: string;
          feedback?: string;
          impact_score?: number;
        }
      >;
      company_bottlenecks: TableDef<
        {
          id: string;
          workflow_id: string | null;
          agent_id: string;
          bottleneck_type: string;
          description: string;
          severity: string;
          recommended_fix: string;
          status: string;
          created_at: string;
          resolved_at: string | null;
        },
        {
          id?: string;
          workflow_id?: string | null;
          agent_id?: string;
          bottleneck_type?: string;
          description?: string;
          severity?: string;
          recommended_fix?: string;
          status?: string;
          created_at?: string;
          resolved_at?: string | null;
        },
        {
          id?: string;
          description?: string;
          severity?: string;
          recommended_fix?: string;
          status?: string;
          resolved_at?: string | null;
        }
      >;
      analytics_events: TableDef<
        {
          id: string;
          event_type: string;
          source: string;
          event_key: string;
          value: number;
          metadata: Json;
          occurred_at: string;
          created_at: string;
        },
        {
          id?: string;
          event_type?: string;
          source?: string;
          event_key?: string;
          value?: number;
          metadata?: Json;
          occurred_at?: string;
          created_at?: string;
        },
        {
          id?: string;
          value?: number;
          metadata?: Json;
        }
      >;
      analytics_snapshots: TableDef<
        {
          id: string;
          snapshot_date: string;
          category: string;
          metrics: Json;
          created_at: string;
        },
        {
          id?: string;
          snapshot_date?: string;
          category?: string;
          metrics?: Json;
          created_at?: string;
        },
        {
          id?: string;
          metrics?: Json;
        }
      >;
      analytics_metrics: TableDef<
        {
          id: string;
          metric_key: string;
          label: string;
          category: string;
          value: number;
          previous_value: number;
          unit: string;
          source: string;
          connection_status: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          metric_key: string;
          label?: string;
          category?: string;
          value?: number;
          previous_value?: number;
          unit?: string;
          source?: string;
          connection_status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          label?: string;
          category?: string;
          value?: number;
          previous_value?: number;
          unit?: string;
          source?: string;
          connection_status?: string;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      creative_projects: TableDef<
        {
          id: string;
          title: string;
          brief: string;
          project_type: string;
          calendar_item_id: string | null;
          source_table: string;
          source_id: string | null;
          platform: string;
          status: string;
          variants_requested: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title?: string;
          brief?: string;
          project_type?: string;
          calendar_item_id?: string | null;
          source_table?: string;
          source_id?: string | null;
          platform?: string;
          status?: string;
          variants_requested?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          title?: string;
          brief?: string;
          project_type?: string;
          calendar_item_id?: string | null;
          platform?: string;
          status?: string;
          variants_requested?: number;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      creative_assets: TableDef<
        {
          id: string;
          project_id: string;
          variant_number: number;
          asset_type: string;
          prompt: string;
          concept: string;
          asset_url: string;
          thumbnail_url: string;
          status: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          project_id: string;
          variant_number?: number;
          asset_type?: string;
          prompt?: string;
          concept?: string;
          asset_url?: string;
          thumbnail_url?: string;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          variant_number?: number;
          asset_type?: string;
          prompt?: string;
          concept?: string;
          asset_url?: string;
          thumbnail_url?: string;
          status?: string;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      creative_reviews: TableDef<
        {
          id: string;
          project_id: string | null;
          asset_id: string | null;
          decision: string;
          feedback: string;
          reviewer: string;
          created_at: string;
        },
        {
          id?: string;
          project_id?: string | null;
          asset_id?: string | null;
          decision?: string;
          feedback?: string;
          reviewer?: string;
          created_at?: string;
        },
        {
          id?: string;
          decision?: string;
          feedback?: string;
        }
      >;
      seo_clusters: TableDef<
        {
          id: string;
          name: string;
          description: string;
          target_posts: number;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          name: string;
          description?: string;
          target_posts?: number;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          name?: string;
          description?: string;
          target_posts?: number;
          updated_at?: string;
        }
      >;
      seo_topics: TableDef<
        {
          id: string;
          topic: string;
          question: string;
          cluster_name: string;
          source: string;
          search_volume_estimate: number;
          competition_note: string;
          status: string;
          keyword_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          topic: string;
          question?: string;
          cluster_name?: string;
          source?: string;
          search_volume_estimate?: number;
          competition_note?: string;
          status?: string;
          keyword_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          topic?: string;
          question?: string;
          cluster_name?: string;
          source?: string;
          search_volume_estimate?: number;
          competition_note?: string;
          status?: string;
          keyword_id?: string | null;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      seo_rank_tracking: TableDef<
        {
          id: string;
          post_id: string | null;
          keyword: string;
          position: number | null;
          url: string;
          search_engine: string;
          source: string;
          checked_at: string;
          created_at: string;
        },
        {
          id?: string;
          post_id?: string | null;
          keyword: string;
          position?: number | null;
          url?: string;
          search_engine?: string;
          source?: string;
          checked_at?: string;
          created_at?: string;
        },
        {
          id?: string;
          position?: number | null;
          url?: string;
          checked_at?: string;
        }
      >;
      agent_scorecards: TableDef<
        {
          id: string;
          agent_id: string;
          period: string;
          period_start: string;
          metric_label: string;
          metric_value: number;
          score: number;
          rank: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          agent_id: string;
          period?: string;
          period_start?: string;
          metric_label?: string;
          metric_value?: number;
          score?: number;
          rank?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          metric_label?: string;
          metric_value?: number;
          score?: number;
          rank?: number;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      launch_checklist: TableDef<
        {
          id: string;
          item_key: string;
          label: string;
          category: string;
          status: string;
          score_weight: number;
          notes: string;
          last_checked_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          item_key: string;
          label?: string;
          category?: string;
          status?: string;
          score_weight?: number;
          notes?: string;
          last_checked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          label?: string;
          category?: string;
          status?: string;
          score_weight?: number;
          notes?: string;
          last_checked_at?: string | null;
          updated_at?: string;
        }
      >;
      seo_blog_keywords: TableDef<
        {
          id: string;
          keyword: string;
          topic_cluster: string;
          source: string;
          search_volume_estimate: number;
          difficulty: number;
          priority_score: number;
          search_demand_notes: string;
          status: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          keyword: string;
          topic_cluster?: string;
          source?: string;
          search_volume_estimate?: number;
          difficulty?: number;
          priority_score?: number;
          search_demand_notes?: string;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          keyword?: string;
          topic_cluster?: string;
          source?: string;
          search_volume_estimate?: number;
          difficulty?: number;
          priority_score?: number;
          search_demand_notes?: string;
          status?: string;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      seo_blog_posts: TableDef<
        {
          id: string;
          keyword_id: string | null;
          keyword: string;
          headline: string;
          seo_title: string;
          meta_description: string;
          slug: string;
          intro: string;
          sections: Json;
          faq: Json;
          cta: string;
          internal_links: Json;
          html: string;
          schema_markup: Json;
          word_count: number;
          status: string;
          risk_level: string;
          voice_check: Json;
          voice_check_passed: boolean;
          review_feedback: string;
          source_agent: string;
          published_url: string;
          published_at: string | null;
          backlinks: Json;
          metadata: Json;
          source_trace: Json;
          body: string;
          author: string;
          category: string;
          tags: Json;
          featured_image: string;
          export_status: string;
          exported_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          keyword_id?: string | null;
          keyword?: string;
          headline?: string;
          seo_title?: string;
          meta_description?: string;
          slug?: string;
          intro?: string;
          sections?: Json;
          faq?: Json;
          cta?: string;
          internal_links?: Json;
          html?: string;
          schema_markup?: Json;
          word_count?: number;
          status?: string;
          risk_level?: string;
          voice_check?: Json;
          voice_check_passed?: boolean;
          review_feedback?: string;
          source_agent?: string;
          published_url?: string;
          published_at?: string | null;
          backlinks?: Json;
          metadata?: Json;
          source_trace?: Json;
          body?: string;
          author?: string;
          category?: string;
          tags?: Json;
          featured_image?: string;
          export_status?: string;
          exported_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          keyword_id?: string | null;
          keyword?: string;
          headline?: string;
          seo_title?: string;
          meta_description?: string;
          slug?: string;
          intro?: string;
          sections?: Json;
          faq?: Json;
          cta?: string;
          internal_links?: Json;
          html?: string;
          schema_markup?: Json;
          word_count?: number;
          status?: string;
          risk_level?: string;
          voice_check?: Json;
          voice_check_passed?: boolean;
          review_feedback?: string;
          source_agent?: string;
          published_url?: string;
          published_at?: string | null;
          backlinks?: Json;
          metadata?: Json;
          source_trace?: Json;
          body?: string;
          author?: string;
          category?: string;
          tags?: Json;
          featured_image?: string;
          export_status?: string;
          exported_at?: string | null;
          updated_at?: string;
        }
      >;
      seo_blog_publish_logs: TableDef<
        {
          id: string;
          post_id: string | null;
          action: string;
          status: string;
          published_url: string;
          error_message: string;
          metadata: Json;
          created_at: string;
        },
        {
          id?: string;
          post_id?: string | null;
          action?: string;
          status?: string;
          published_url?: string;
          error_message?: string;
          metadata?: Json;
          created_at?: string;
        },
        {
          id?: string;
          status?: string;
          published_url?: string;
          error_message?: string;
        }
      >;
      notifications: TableDef<
        {
          id: string;
          type: string;
          title: string;
          message: string;
          target_route: string;
          target_table: string | null;
          target_id: string | null;
          priority: string;
          read_at: string | null;
          metadata: Json;
          created_at: string;
        },
        {
          id?: string;
          type: string;
          title: string;
          message?: string;
          target_route?: string;
          target_table?: string | null;
          target_id?: string | null;
          priority?: string;
          read_at?: string | null;
          metadata?: Json;
          created_at?: string;
        },
        {
          id?: string;
          type?: string;
          title?: string;
          message?: string;
          target_route?: string;
          target_table?: string | null;
          target_id?: string | null;
          priority?: string;
          read_at?: string | null;
          metadata?: Json;
          created_at?: string;
        }
      >;
      content_workflows: TableDef<
        {
          id: string;
          source_table: string;
          source_id: string;
          content_type: string;
          title: string;
          current_stage: string;
          current_owner: string;
          assigned_agent: string;
          next_agent: string;
          next_action: string;
          destination_label: string;
          founder_action_required: boolean;
          last_transition_at: string;
          history_log: Json;
          calendar_item_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          source_table: string;
          source_id: string;
          content_type?: string;
          title?: string;
          current_stage?: string;
          current_owner?: string;
          assigned_agent?: string;
          next_agent?: string;
          next_action?: string;
          destination_label?: string;
          founder_action_required?: boolean;
          last_transition_at?: string;
          history_log?: Json;
          calendar_item_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          title?: string;
          current_stage?: string;
          current_owner?: string;
          assigned_agent?: string;
          next_agent?: string;
          next_action?: string;
          destination_label?: string;
          founder_action_required?: boolean;
          last_transition_at?: string;
          history_log?: Json;
          calendar_item_id?: string | null;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      intelligence_alerts: TableDef<
        {
          id: string;
          source: string;
          source_type: string;
          title: string;
          body: string;
          url: string;
          author: string;
          subreddit: string;
          alert_name: string;
          detected_keywords: string[];
          classification: string | null;
          priority: string | null;
          assigned_agent: string | null;
          status: string;
          raw: Json;
          external_created_at: string | null;
          created_at: string;
          updated_at: string;
          processed_at: string | null;
          external_id: string;
          raw_payload: Json;
          received_at: string;
          classification_reason: string;
          relevance_score: number;
          relevance_category: string;
          relevance_reason: string;
        },
        {
          id?: string;
          source?: string;
          source_type?: string;
          title?: string;
          body?: string;
          url?: string;
          author?: string;
          subreddit?: string;
          alert_name?: string;
          detected_keywords?: string[];
          classification?: string | null;
          priority?: string | null;
          assigned_agent?: string | null;
          status?: string;
          raw?: Json;
          external_created_at?: string | null;
          created_at?: string;
          updated_at?: string;
          processed_at?: string | null;
          external_id?: string;
          raw_payload?: Json;
          received_at?: string;
          classification_reason?: string;
          relevance_score?: number;
          relevance_category?: string;
          relevance_reason?: string;
        },
        {
          id?: string;
          source?: string;
          source_type?: string;
          title?: string;
          body?: string;
          url?: string;
          author?: string;
          subreddit?: string;
          alert_name?: string;
          detected_keywords?: string[];
          classification?: string | null;
          priority?: string | null;
          assigned_agent?: string | null;
          status?: string;
          raw?: Json;
          external_created_at?: string | null;
          processed_at?: string | null;
          external_id?: string;
          raw_payload?: Json;
          received_at?: string;
          updated_at?: string;
          classification_reason?: string;
          relevance_score?: number;
          relevance_category?: string;
          relevance_reason?: string;
        }
      >;
      intelligence_rejected: TableDef<
        {
          id: string;
          source: string;
          source_type: string;
          title: string;
          body: string;
          url: string;
          author: string;
          subreddit: string;
          alert_name: string;
          detected_keywords: string[];
          reject_reason: string;
          reject_category: string;
          raw_payload: Json;
          external_id: string;
          received_at: string;
          created_at: string;
        },
        {
          id?: string;
          source?: string;
          source_type?: string;
          title?: string;
          body?: string;
          url?: string;
          author?: string;
          subreddit?: string;
          alert_name?: string;
          detected_keywords?: string[];
          reject_reason?: string;
          reject_category?: string;
          raw_payload?: Json;
          external_id?: string;
          received_at?: string;
          created_at?: string;
        },
        {
          id?: string;
          source?: string;
          source_type?: string;
          title?: string;
          body?: string;
          url?: string;
          author?: string;
          subreddit?: string;
          alert_name?: string;
          detected_keywords?: string[];
          reject_reason?: string;
          reject_category?: string;
          raw_payload?: Json;
          external_id?: string;
          received_at?: string;
        }
      >;
      content_pipeline: TableDef<
        {
          id: string;
          source_table: string;
          source_id: string;
          title: string;
          body: string;
          status: string;
          destination: string;
          workflow_history: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          source_table?: string;
          source_id?: string;
          title?: string;
          body?: string;
          status?: string;
          destination?: string;
          workflow_history?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          source_table?: string;
          source_id?: string;
          title?: string;
          body?: string;
          status?: string;
          destination?: string;
          workflow_history?: Json;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      video_generation_queue: TableDef<
        {
          id: string;
          source_table: string;
          source_id: string | null;
          title: string;
          concept: string;
          hook: string;
          platform: string;
          status: string;
          priority: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          source_table?: string;
          source_id?: string | null;
          title?: string;
          concept?: string;
          hook?: string;
          platform?: string;
          status?: string;
          priority?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          source_table?: string;
          source_id?: string | null;
          title?: string;
          concept?: string;
          hook?: string;
          platform?: string;
          status?: string;
          priority?: number;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      social_content_posts: TableDef<
        {
          id: string;
          platform: string;
          format: string;
          title: string;
          copy: string;
          hook: string;
          caption: string;
          hashtags: string[];
          source_trace: Json;
          status: string;
          assigned_agent: string;
          brand_score: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          platform?: string;
          format?: string;
          title?: string;
          copy?: string;
          hook?: string;
          caption?: string;
          hashtags?: string[];
          source_trace?: Json;
          status?: string;
          assigned_agent?: string;
          brand_score?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          platform?: string;
          format?: string;
          title?: string;
          copy?: string;
          hook?: string;
          caption?: string;
          hashtags?: string[];
          source_trace?: Json;
          status?: string;
          assigned_agent?: string;
          brand_score?: number;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      meme_ideas: TableDef<
        {
          id: string;
          title: string;
          caption: string;
          visual_prompt: string;
          platform: string;
          source_trace: Json;
          risk_level: string;
          status: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title?: string;
          caption?: string;
          visual_prompt?: string;
          platform?: string;
          source_trace?: Json;
          risk_level?: string;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          title?: string;
          caption?: string;
          visual_prompt?: string;
          platform?: string;
          source_trace?: Json;
          risk_level?: string;
          status?: string;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      intelligence_runs: TableDef<
        {
          id: string;
          started_at: string;
          completed_at: string | null;
          fetched_count: number;
          inserted_count: number;
          duplicate_count: number;
          error_count: number;
          status: string;
          error_message: string;
          metadata: Json;
          created_at: string;
        },
        {
          id?: string;
          started_at?: string;
          completed_at?: string | null;
          fetched_count?: number;
          inserted_count?: number;
          duplicate_count?: number;
          error_count?: number;
          status?: string;
          error_message?: string;
          metadata?: Json;
          created_at?: string;
        },
        {
          id?: string;
          started_at?: string;
          completed_at?: string | null;
          fetched_count?: number;
          inserted_count?: number;
          duplicate_count?: number;
          error_count?: number;
          status?: string;
          error_message?: string;
          metadata?: Json;
          created_at?: string;
        }
      >;
      f5bot_alerts: TableDef<
        {
          id: string;
          external_id: string;
          source: string;
          source_url: string;
          title: string;
          body: string;
          author: string;
          matched_keyword: string;
          keyword_group: string;
          published_at: string | null;
          received_at: string;
          raw_payload: Json;
          status: string;
          data_source: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          external_id: string;
          source?: string;
          source_url?: string;
          title?: string;
          body?: string;
          author?: string;
          matched_keyword?: string;
          keyword_group?: string;
          published_at?: string | null;
          received_at?: string;
          raw_payload?: Json;
          status?: string;
          data_source?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          external_id?: string;
          source?: string;
          source_url?: string;
          title?: string;
          body?: string;
          author?: string;
          matched_keyword?: string;
          keyword_group?: string;
          published_at?: string | null;
          received_at?: string;
          raw_payload?: Json;
          status?: string;
          data_source?: string;
          updated_at?: string;
        }
      >;
      intelligence_opportunities: TableDef<
        {
          id: string;
          source_type: string;
          source_table: string;
          source_id: string;
          platform: string;
          title: string;
          summary: string;
          opportunity_type: string;
          priority: string;
          recommended_agent: string;
          suggested_action: string;
          source_url: string;
          status: string;
          workflow_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          source_type?: string;
          source_table?: string;
          source_id: string;
          platform?: string;
          title?: string;
          summary?: string;
          opportunity_type?: string;
          priority?: string;
          recommended_agent?: string;
          suggested_action?: string;
          source_url?: string;
          status?: string;
          workflow_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          source_type?: string;
          source_table?: string;
          source_id?: string;
          platform?: string;
          title?: string;
          summary?: string;
          opportunity_type?: string;
          priority?: string;
          recommended_agent?: string;
          suggested_action?: string;
          source_url?: string;
          status?: string;
          workflow_id?: string | null;
          metadata?: Json;
          updated_at?: string;
        }
      >;
      content_calendar: TableDef<
        {
          id: string;
          title: string;
          platform: string;
          channel: string;
          content_type: string;
          caption: string;
          hook: string;
          cta: string;
          asset_url: string;
          asset_type: string;
          asset_prompt: string;
          scheduled_for: string | null;
          published_at: string | null;
          status: string;
          approval_status: string;
          source_agent: string;
          source_table: string;
          source_id: string | null;
          copy_text: string;
          platform_url: string;
          notes: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title?: string;
          platform?: string;
          channel?: string;
          content_type?: string;
          caption?: string;
          hook?: string;
          cta?: string;
          asset_url?: string;
          asset_type?: string;
          asset_prompt?: string;
          scheduled_for?: string | null;
          published_at?: string | null;
          status?: string;
          approval_status?: string;
          source_agent?: string;
          source_table?: string;
          source_id?: string | null;
          copy_text?: string;
          platform_url?: string;
          notes?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          title?: string;
          platform?: string;
          channel?: string;
          content_type?: string;
          caption?: string;
          hook?: string;
          cta?: string;
          asset_url?: string;
          asset_type?: string;
          asset_prompt?: string;
          scheduled_for?: string | null;
          published_at?: string | null;
          status?: string;
          approval_status?: string;
          source_agent?: string;
          source_table?: string;
          source_id?: string | null;
          copy_text?: string;
          platform_url?: string;
          notes?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      content_assets: TableDef<
        {
          id: string;
          calendar_item_id: string;
          asset_type: string;
          asset_url: string;
          asset_prompt: string;
          thumbnail_url: string;
          status: string;
          created_by_agent: string;
          metadata: Json;
          created_at: string;
        },
        {
          id?: string;
          calendar_item_id: string;
          asset_type?: string;
          asset_url?: string;
          asset_prompt?: string;
          thumbnail_url?: string;
          status?: string;
          created_by_agent?: string;
          metadata?: Json;
          created_at?: string;
        },
        {
          id?: string;
          calendar_item_id?: string;
          asset_type?: string;
          asset_url?: string;
          asset_prompt?: string;
          thumbnail_url?: string;
          status?: string;
          created_by_agent?: string;
          metadata?: Json;
          created_at?: string;
        }
      >;
      automation_rules: TableDef<
        {
          id: string;
          rule_key: string;
          label: string;
          description: string;
          agent_id: string;
          category: string;
          risk_level: string;
          action: string;
          enabled: boolean;
          config: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          rule_key: string;
          label?: string;
          description?: string;
          agent_id?: string;
          category?: string;
          risk_level?: string;
          action?: string;
          enabled?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          rule_key?: string;
          label?: string;
          description?: string;
          agent_id?: string;
          category?: string;
          risk_level?: string;
          action?: string;
          enabled?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      automation_runs: TableDef<
        {
          id: string;
          rule_key: string;
          agent_id: string;
          action: string;
          status: string;
          items_processed: number;
          items_created: number;
          detail: string;
          error_message: string;
          metadata: Json;
          run_type: string;
          summary: Json;
          errors: Json;
          started_at: string;
          completed_at: string | null;
          created_at: string;
        },
        {
          id?: string;
          rule_key?: string;
          agent_id?: string;
          action?: string;
          status?: string;
          items_processed?: number;
          items_created?: number;
          detail?: string;
          error_message?: string;
          metadata?: Json;
          run_type?: string;
          summary?: Json;
          errors?: Json;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        },
        {
          id?: string;
          rule_key?: string;
          agent_id?: string;
          action?: string;
          status?: string;
          items_processed?: number;
          items_created?: number;
          detail?: string;
          error_message?: string;
          metadata?: Json;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        }
      >;
      publishing_packages: TableDef<
        {
          id: string;
          calendar_item_id: string;
          platform: string;
          caption: string;
          script: string;
          hashtags: Json;
          asset_prompt: string;
          asset_url: string;
          thumbnail_url: string;
          upload_checklist: Json;
          recommended_post_time: string;
          recommended_post_at: string | null;
          platform_notes: string;
          copy_text: string;
          status: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          calendar_item_id: string;
          platform?: string;
          caption?: string;
          script?: string;
          hashtags?: Json;
          asset_prompt?: string;
          asset_url?: string;
          thumbnail_url?: string;
          upload_checklist?: Json;
          recommended_post_time?: string;
          recommended_post_at?: string | null;
          platform_notes?: string;
          copy_text?: string;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          calendar_item_id?: string;
          platform?: string;
          caption?: string;
          script?: string;
          hashtags?: Json;
          asset_prompt?: string;
          asset_url?: string;
          thumbnail_url?: string;
          upload_checklist?: Json;
          recommended_post_time?: string;
          recommended_post_at?: string | null;
          platform_notes?: string;
          copy_text?: string;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      batch_approvals: TableDef<
        {
          id: string;
          batch_date: string;
          item_type: string;
          risk_level: string;
          platform: string;
          title: string;
          content: string;
          source_table: string;
          source_id: string | null;
          calendar_item_id: string | null;
          status: string;
          decided_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          batch_date?: string;
          item_type?: string;
          risk_level?: string;
          platform?: string;
          title?: string;
          content?: string;
          source_table?: string;
          source_id?: string | null;
          calendar_item_id?: string | null;
          status?: string;
          decided_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          batch_date?: string;
          item_type?: string;
          risk_level?: string;
          platform?: string;
          title?: string;
          content?: string;
          source_table?: string;
          source_id?: string | null;
          calendar_item_id?: string | null;
          status?: string;
          decided_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      content_publish_logs: TableDef<
        {
          id: string;
          calendar_item_id: string;
          platform: string;
          status: string;
          published_url: string;
          error_message: string;
          metadata: Json;
          created_at: string;
        },
        {
          id?: string;
          calendar_item_id: string;
          platform?: string;
          status?: string;
          published_url?: string;
          error_message?: string;
          metadata?: Json;
          created_at?: string;
        },
        {
          id?: string;
          calendar_item_id?: string;
          platform?: string;
          status?: string;
          published_url?: string;
          error_message?: string;
          metadata?: Json;
          created_at?: string;
        }
      >;
      discovery_items: TableDef<
        {
          id: string;
          brief_id: string;
          item_type: string;
          title: string;
          description: string;
          source: string;
          relevance_score: number;
          created_at: string;
        },
        {
          id?: string;
          brief_id: string;
          item_type: string;
          title: string;
          description?: string;
          source?: string;
          relevance_score?: number;
          created_at?: string;
        },
        {
          id?: string;
          brief_id?: string;
          item_type?: string;
          title?: string;
          description?: string;
          source?: string;
          relevance_score?: number;
          created_at?: string;
        }
      >;
      creator_leads: TableDef<
        {
          id: string;
          name: string;
          handle: string;
          platform: string;
          category: string;
          followers: number;
          engagement_rate: number;
          average_views: number;
          location: string;
          email: string;
          website: string;
          partnership_score: number;
          audience_fit: number;
          engagement_score: number;
          posting_frequency: number;
          content_quality: number;
          growth_trend: number;
          partnership_status: string;
          priority: string;
          source: string;
          suggested_ideas: Json;
          notes: string;
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          name: string;
          handle?: string;
          platform: string;
          category?: string;
          followers?: number;
          engagement_rate?: number;
          average_views?: number;
          location?: string;
          email?: string;
          website?: string;
          partnership_score?: number;
          audience_fit?: number;
          engagement_score?: number;
          posting_frequency?: number;
          content_quality?: number;
          growth_trend?: number;
          partnership_status?: string;
          priority?: string;
          source?: string;
          suggested_ideas?: Json;
          notes?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          name?: string;
          handle?: string;
          platform?: string;
          category?: string;
          followers?: number;
          engagement_rate?: number;
          average_views?: number;
          location?: string;
          email?: string;
          website?: string;
          partnership_score?: number;
          audience_fit?: number;
          engagement_score?: number;
          posting_frequency?: number;
          content_quality?: number;
          growth_trend?: number;
          partnership_status?: string;
          priority?: string;
          source?: string;
          suggested_ideas?: Json;
          notes?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      creator_partnerships: TableDef<
        {
          id: string;
          creator_lead_id: string | null;
          title: string;
          idea_type: string;
          description: string;
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          creator_lead_id?: string | null;
          title: string;
          idea_type: string;
          description?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          creator_lead_id?: string | null;
          title?: string;
          idea_type?: string;
          description?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      community_mentions: TableDef<
        {
          id: string;
          platform: string;
          author: string;
          content: string;
          url: string;
          sentiment: string;
          processed: boolean;
          created_at: string;
        },
        {
          id?: string;
          platform: string;
          author?: string;
          content?: string;
          url?: string;
          sentiment?: string;
          processed?: boolean;
          created_at?: string;
        },
        {
          id?: string;
          platform?: string;
          author?: string;
          content?: string;
          url?: string;
          sentiment?: string;
          processed?: boolean;
          created_at?: string;
        }
      >;
      community_reply_drafts: TableDef<
        {
          id: string;
          opportunity_id: string | null;
          platform: string;
          author: string;
          original_content: string;
          draft: string;
          status: string;
          created_at: string;
          updated_at: string;
        } & SourceColumns,
        {
          id?: string;
          opportunity_id?: string | null;
          platform: string;
          author?: string;
          original_content?: string;
          draft?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        } & SourceColumns,
        {
          id?: string;
          opportunity_id?: string | null;
          platform?: string;
          author?: string;
          original_content?: string;
          draft?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        } & SourceColumns
      >;
      agent_activity_log: TableDef<
        {
          id: string;
          agent_id: string;
          action: string;
          detail: string;
          metadata: Json;
          created_at: string;
        },
        {
          id?: string;
          agent_id: string;
          action: string;
          detail?: string;
          metadata?: Json;
          created_at?: string;
        },
        {
          id?: string;
          agent_id?: string;
          action?: string;
          detail?: string;
          metadata?: Json;
          created_at?: string;
        }
      >;
      competitor_scoreboard: TableDef<
        {
          id: string;
          name: string;
          slug: string;
          estimated_growth: number;
          app_store_rank: number | null;
          app_store_category: string;
          review_trend: string;
          review_score: number;
          social_engagement_score: number;
          new_features_count: number;
          recent_campaigns: Json;
          threat_level: number;
          opportunity_level: number;
          notes: string;
          last_scanned_at: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          name: string;
          slug: string;
          estimated_growth?: number;
          app_store_rank?: number | null;
          app_store_category?: string;
          review_trend?: string;
          review_score?: number;
          social_engagement_score?: number;
          new_features_count?: number;
          recent_campaigns?: Json;
          threat_level?: number;
          opportunity_level?: number;
          notes?: string;
          last_scanned_at?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          name?: string;
          slug?: string;
          estimated_growth?: number;
          app_store_rank?: number | null;
          app_store_category?: string;
          review_trend?: string;
          review_score?: number;
          social_engagement_score?: number;
          new_features_count?: number;
          recent_campaigns?: Json;
          threat_level?: number;
          opportunity_level?: number;
          notes?: string;
          last_scanned_at?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      competitor_intel_alerts: TableDef<
        {
          id: string;
          competitor: string;
          alert_type: string;
          title: string;
          description: string;
          severity: string;
          source: string;
          recommended_action: string;
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          competitor: string;
          alert_type: string;
          title: string;
          description?: string;
          severity?: string;
          source?: string;
          recommended_action?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          competitor?: string;
          alert_type?: string;
          title?: string;
          description?: string;
          severity?: string;
          source?: string;
          recommended_action?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      competitor_daily_briefs: TableDef<
        {
          id: string;
          brief_date: string;
          biggest_threat: string;
          biggest_opportunity: string;
          recommended_response: string;
          alerts_count: number;
          competitors_scanned: number;
          status: string;
          created_at: string;
        },
        {
          id?: string;
          brief_date?: string;
          biggest_threat?: string;
          biggest_opportunity?: string;
          recommended_response?: string;
          alerts_count?: number;
          competitors_scanned?: number;
          status?: string;
          created_at?: string;
        },
        {
          id?: string;
          brief_date?: string;
          biggest_threat?: string;
          biggest_opportunity?: string;
          recommended_response?: string;
          alerts_count?: number;
          competitors_scanned?: number;
          status?: string;
          created_at?: string;
        }
      >;
      bloom_production_runs: TableDef<
        {
          id: string;
          run_date: string;
          status: string;
          pieces_generated: number;
          pieces_queued: number;
          scout_inputs: number;
          roots_inputs: number;
          sentinel_inputs: number;
          seasonal_inputs: number;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          run_date?: string;
          status?: string;
          pieces_generated?: number;
          pieces_queued?: number;
          scout_inputs?: number;
          roots_inputs?: number;
          sentinel_inputs?: number;
          seasonal_inputs?: number;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          run_date?: string;
          status?: string;
          pieces_generated?: number;
          pieces_queued?: number;
          scout_inputs?: number;
          roots_inputs?: number;
          sentinel_inputs?: number;
          seasonal_inputs?: number;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      bloom_content_pieces: TableDef<
        {
          id: string;
          run_id: string | null;
          format: string;
          platform: string;
          title: string;
          hook: string;
          caption: string;
          cta: string;
          viral_score: number;
          emotional_trigger: string;
          difficulty_score: number;
          source_type: string;
          source_detail: string;
          scheduled_date: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          run_id?: string | null;
          format: string;
          platform?: string;
          title?: string;
          hook?: string;
          caption?: string;
          cta?: string;
          viral_score?: number;
          emotional_trigger?: string;
          difficulty_score?: number;
          source_type?: string;
          source_detail?: string;
          scheduled_date?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          run_id?: string | null;
          format?: string;
          platform?: string;
          title?: string;
          hook?: string;
          caption?: string;
          cta?: string;
          viral_score?: number;
          emotional_trigger?: string;
          difficulty_score?: number;
          source_type?: string;
          source_detail?: string;
          scheduled_date?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      sage_review_batches: TableDef<
        {
          id: string;
          run_date: string;
          status: string;
          pieces_reviewed: number;
          approved_count: number;
          rejected_count: number;
          avg_aggregate_score: number;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          run_date?: string;
          status?: string;
          pieces_reviewed?: number;
          approved_count?: number;
          rejected_count?: number;
          avg_aggregate_score?: number;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          run_date?: string;
          status?: string;
          pieces_reviewed?: number;
          approved_count?: number;
          rejected_count?: number;
          avg_aggregate_score?: number;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      sage_content_reviews: TableDef<
        {
          id: string;
          batch_id: string | null;
          bloom_piece_id: string;
          originality_score: number;
          humor_score: number;
          emotional_impact_score: number;
          shareability_score: number;
          storytelling_score: number;
          educational_score: number;
          aggregate_score: number;
          recommendation: string;
          rejection_reason: string;
          hook_suggestion: string;
          cta_suggestion: string;
          storytelling_suggestion: string;
          creative_opportunity: string;
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          batch_id?: string | null;
          bloom_piece_id: string;
          originality_score?: number;
          humor_score?: number;
          emotional_impact_score?: number;
          shareability_score?: number;
          storytelling_score?: number;
          educational_score?: number;
          aggregate_score?: number;
          recommendation?: string;
          rejection_reason?: string;
          hook_suggestion?: string;
          cta_suggestion?: string;
          storytelling_suggestion?: string;
          creative_opportunity?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          batch_id?: string | null;
          bloom_piece_id?: string;
          originality_score?: number;
          humor_score?: number;
          emotional_impact_score?: number;
          shareability_score?: number;
          storytelling_score?: number;
          educational_score?: number;
          aggregate_score?: number;
          recommendation?: string;
          rejection_reason?: string;
          hook_suggestion?: string;
          cta_suggestion?: string;
          storytelling_suggestion?: string;
          creative_opportunity?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      sprout_scheduled_posts: TableDef<
        {
          id: string;
          bloom_piece_id: string | null;
          approval_queue_id: string | null;
          platform: string;
          title: string;
          hook: string;
          caption: string;
          cta: string;
          scheduled_at: string | null;
          recommended_time_label: string;
          best_time_score: number;
          timezone: string;
          status: string;
          schedule_approved: boolean;
          notes: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          bloom_piece_id?: string | null;
          approval_queue_id?: string | null;
          platform: string;
          title?: string;
          hook?: string;
          caption?: string;
          cta?: string;
          scheduled_at?: string | null;
          recommended_time_label?: string;
          best_time_score?: number;
          timezone?: string;
          status?: string;
          schedule_approved?: boolean;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          bloom_piece_id?: string | null;
          approval_queue_id?: string | null;
          platform?: string;
          title?: string;
          hook?: string;
          caption?: string;
          cta?: string;
          scheduled_at?: string | null;
          recommended_time_label?: string;
          best_time_score?: number;
          timezone?: string;
          status?: string;
          schedule_approved?: boolean;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      echo_feedback: TableDef<
        {
          id: string;
          source: string;
          category: string;
          feedback_type: string;
          sentiment: string;
          content: string;
          author: string;
          rating: number | null;
          report_date: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          source: string;
          category: string;
          feedback_type?: string;
          sentiment?: string;
          content?: string;
          author?: string;
          rating?: number | null;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          source?: string;
          category?: string;
          feedback_type?: string;
          sentiment?: string;
          content?: string;
          author?: string;
          rating?: number | null;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      echo_feature_requests: TableDef<
        {
          id: string;
          feature_name: string;
          category: string;
          description: string;
          frequency: number;
          priority: number;
          impact: number;
          estimated_demand: number;
          trend: string;
          status: string;
          report_date: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          feature_name: string;
          category?: string;
          description?: string;
          frequency?: number;
          priority?: number;
          impact?: number;
          estimated_demand?: number;
          trend?: string;
          status?: string;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          feature_name?: string;
          category?: string;
          description?: string;
          frequency?: number;
          priority?: number;
          impact?: number;
          estimated_demand?: number;
          trend?: string;
          status?: string;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      echo_sentiment: TableDef<
        {
          id: string;
          snapshot_date: string;
          positive_count: number;
          neutral_count: number;
          negative_count: number;
          urgent_count: number;
          positive_pct: number;
          negative_pct: number;
          trend_direction: string;
          top_category: string;
          notes: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          snapshot_date?: string;
          positive_count?: number;
          neutral_count?: number;
          negative_count?: number;
          urgent_count?: number;
          positive_pct?: number;
          negative_pct?: number;
          trend_direction?: string;
          top_category?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          snapshot_date?: string;
          positive_count?: number;
          neutral_count?: number;
          negative_count?: number;
          urgent_count?: number;
          positive_pct?: number;
          negative_pct?: number;
          trend_direction?: string;
          top_category?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      echo_love_signals: TableDef<
        {
          id: string;
          feature: string;
          quote: string;
          source: string;
          category: string;
          marketing_potential: number;
          testimonial_ready: boolean;
          ambassador_potential: boolean;
          report_date: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          feature?: string;
          quote?: string;
          source?: string;
          category?: string;
          marketing_potential?: number;
          testimonial_ready?: boolean;
          ambassador_potential?: boolean;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          feature?: string;
          quote?: string;
          source?: string;
          category?: string;
          marketing_potential?: number;
          testimonial_ready?: boolean;
          ambassador_potential?: boolean;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      echo_churn_risks: TableDef<
        {
          id: string;
          title: string;
          description: string;
          churn_reason: string;
          severity: string;
          affected_users_estimate: number;
          suggested_action: string;
          status: string;
          report_date: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title: string;
          description?: string;
          churn_reason: string;
          severity?: string;
          affected_users_estimate?: number;
          suggested_action?: string;
          status?: string;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          title?: string;
          description?: string;
          churn_reason?: string;
          severity?: string;
          affected_users_estimate?: number;
          suggested_action?: string;
          status?: string;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      echo_reports: TableDef<
        {
          id: string;
          report_type: string;
          run_date: string;
          executive_summary: string;
          sections: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          report_type: string;
          run_date?: string;
          executive_summary?: string;
          sections?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          report_type?: string;
          run_date?: string;
          executive_summary?: string;
          sections?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      fern_opportunities: TableDef<
        {
          id: string;
          title: string;
          description: string;
          traffic_source: string;
          opportunity_type: string;
          reach: number;
          cost: number;
          difficulty: number;
          virality: number;
          estimated_installs: number;
          priority_score: number;
          source_agent: string;
          report_date: string;
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title: string;
          description?: string;
          traffic_source: string;
          opportunity_type?: string;
          reach?: number;
          cost?: number;
          difficulty?: number;
          virality?: number;
          estimated_installs?: number;
          priority_score?: number;
          source_agent?: string;
          report_date?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          title?: string;
          description?: string;
          traffic_source?: string;
          opportunity_type?: string;
          reach?: number;
          cost?: number;
          difficulty?: number;
          virality?: number;
          estimated_installs?: number;
          priority_score?: number;
          source_agent?: string;
          report_date?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      fern_experiments: TableDef<
        {
          id: string;
          name: string;
          hypothesis: string;
          effort: string;
          expected_impact: number;
          status: string;
          results: string;
          report_date: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          name: string;
          hypothesis?: string;
          effort?: string;
          expected_impact?: number;
          status?: string;
          results?: string;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          name?: string;
          hypothesis?: string;
          effort?: string;
          expected_impact?: number;
          status?: string;
          results?: string;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      fern_forecasts: TableDef<
        {
          id: string;
          horizon: string;
          traffic_source: string;
          predicted_installs: number;
          confidence: number;
          assumptions: string;
          report_date: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          horizon: string;
          traffic_source?: string;
          predicted_installs?: number;
          confidence?: number;
          assumptions?: string;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          horizon?: string;
          traffic_source?: string;
          predicted_installs?: number;
          confidence?: number;
          assumptions?: string;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      atlas_growth_metrics: TableDef<
        {
          id: string;
          snapshot_date: string;
          total_users: number;
          total_installs: number;
          waitlist_count: number;
          weekly_active_users: number;
          monthly_active_users: number;
          traffic_sessions: number;
          conversion_rate: number;
          engagement_rate: number;
          retention_d7: number;
          retention_d30: number;
          growth_stage: string;
          channel_breakdown: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          snapshot_date?: string;
          total_users?: number;
          total_installs?: number;
          waitlist_count?: number;
          weekly_active_users?: number;
          monthly_active_users?: number;
          traffic_sessions?: number;
          conversion_rate?: number;
          engagement_rate?: number;
          retention_d7?: number;
          retention_d30?: number;
          growth_stage?: string;
          channel_breakdown?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          snapshot_date?: string;
          total_users?: number;
          total_installs?: number;
          waitlist_count?: number;
          weekly_active_users?: number;
          monthly_active_users?: number;
          traffic_sessions?: number;
          conversion_rate?: number;
          engagement_rate?: number;
          retention_d7?: number;
          retention_d30?: number;
          growth_stage?: string;
          channel_breakdown?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      atlas_experiments: TableDef<
        {
          id: string;
          name: string;
          hypothesis: string;
          expected_outcome: string;
          effort: string;
          impact: number;
          priority_score: number;
          status: string;
          results: string;
          report_date: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          name: string;
          hypothesis?: string;
          expected_outcome?: string;
          effort?: string;
          impact?: number;
          priority_score?: number;
          status?: string;
          results?: string;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          name?: string;
          hypothesis?: string;
          expected_outcome?: string;
          effort?: string;
          impact?: number;
          priority_score?: number;
          status?: string;
          results?: string;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      atlas_recommendations: TableDef<
        {
          id: string;
          title: string;
          description: string;
          category: string;
          reach: number;
          cost: number;
          difficulty: number;
          virality: number;
          revenue_potential: number;
          retention_potential: number;
          priority_score: number;
          source_agent: string;
          report_date: string;
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title: string;
          description?: string;
          category?: string;
          reach?: number;
          cost?: number;
          difficulty?: number;
          virality?: number;
          revenue_potential?: number;
          retention_potential?: number;
          priority_score?: number;
          source_agent?: string;
          report_date?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          reach?: number;
          cost?: number;
          difficulty?: number;
          virality?: number;
          revenue_potential?: number;
          retention_potential?: number;
          priority_score?: number;
          source_agent?: string;
          report_date?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      atlas_forecasts: TableDef<
        {
          id: string;
          horizon: string;
          predicted_users: number;
          predicted_installs: number;
          growth_rate_pct: number;
          confidence: number;
          assumptions: string;
          report_date: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          horizon: string;
          predicted_users?: number;
          predicted_installs?: number;
          growth_rate_pct?: number;
          confidence?: number;
          assumptions?: string;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          horizon?: string;
          predicted_users?: number;
          predicted_installs?: number;
          growth_rate_pct?: number;
          confidence?: number;
          assumptions?: string;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      atlas_growth_reports: TableDef<
        {
          id: string;
          report_type: string;
          run_date: string;
          executive_summary: string;
          sections: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          report_type: string;
          run_date?: string;
          executive_summary?: string;
          sections?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          report_type?: string;
          run_date?: string;
          executive_summary?: string;
          sections?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      atlas_bottlenecks: TableDef<
        {
          id: string;
          bottleneck_type: string;
          title: string;
          description: string;
          severity: string;
          suggested_fix: string;
          metric_value: number | null;
          benchmark_value: number | null;
          status: string;
          report_date: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          bottleneck_type: string;
          title: string;
          description?: string;
          severity?: string;
          suggested_fix?: string;
          metric_value?: number | null;
          benchmark_value?: number | null;
          status?: string;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          bottleneck_type?: string;
          title?: string;
          description?: string;
          severity?: string;
          suggested_fix?: string;
          metric_value?: number | null;
          benchmark_value?: number | null;
          status?: string;
          report_date?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      ivy_briefs: TableDef<
        {
          id: string;
          brief_type: string;
          run_date: string;
          executive_summary: string;
          sections: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          brief_type: string;
          run_date?: string;
          executive_summary?: string;
          sections?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          brief_type?: string;
          run_date?: string;
          executive_summary?: string;
          sections?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      ivy_recommendations: TableDef<
        {
          id: string;
          category: string;
          title: string;
          description: string;
          priority_score: number;
          revenue_impact: number;
          growth_impact: number;
          virality_potential: number;
          time_sensitivity: number;
          source_agent: string;
          source_entity_id: string | null;
          status: string;
          brief_date: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          category: string;
          title: string;
          description?: string;
          priority_score?: number;
          revenue_impact?: number;
          growth_impact?: number;
          virality_potential?: number;
          time_sensitivity?: number;
          source_agent?: string;
          source_entity_id?: string | null;
          status?: string;
          brief_date?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          category?: string;
          title?: string;
          description?: string;
          priority_score?: number;
          revenue_impact?: number;
          growth_impact?: number;
          virality_potential?: number;
          time_sensitivity?: number;
          source_agent?: string;
          source_entity_id?: string | null;
          status?: string;
          brief_date?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      ivy_alerts: TableDef<
        {
          id: string;
          alert_type: string;
          title: string;
          description: string;
          priority_score: number;
          source_agent: string;
          source_entity_id: string | null;
          status: string;
          brief_date: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          alert_type: string;
          title: string;
          description?: string;
          priority_score?: number;
          source_agent?: string;
          source_entity_id?: string | null;
          status?: string;
          brief_date?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          alert_type?: string;
          title?: string;
          description?: string;
          priority_score?: number;
          source_agent?: string;
          source_entity_id?: string | null;
          status?: string;
          brief_date?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      oak_partnership_pipeline: TableDef<
        {
          id: string;
          creator_lead_id: string | null;
          partner_name: string;
          partner_type: string;
          contact_name: string;
          contact_email: string;
          location: string;
          stage: string;
          outreach_draft: string;
          collaboration_idea: string;
          follow_up_at: string | null;
          follow_up_note: string;
          revenue_generated: number;
          installs_generated: number;
          priority: string;
          notes: string;
          outreach_approved: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          creator_lead_id?: string | null;
          partner_name: string;
          partner_type: string;
          contact_name?: string;
          contact_email?: string;
          location?: string;
          stage?: string;
          outreach_draft?: string;
          collaboration_idea?: string;
          follow_up_at?: string | null;
          follow_up_note?: string;
          revenue_generated?: number;
          installs_generated?: number;
          priority?: string;
          notes?: string;
          outreach_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          creator_lead_id?: string | null;
          partner_name?: string;
          partner_type?: string;
          contact_name?: string;
          contact_email?: string;
          location?: string;
          stage?: string;
          outreach_draft?: string;
          collaboration_idea?: string;
          follow_up_at?: string | null;
          follow_up_note?: string;
          revenue_generated?: number;
          installs_generated?: number;
          priority?: string;
          notes?: string;
          outreach_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      bloom_content_performance: TableDef<
        {
          id: string;
          content_piece_id: string;
          platform: string;
          impressions: number;
          engagements: number;
          clicks: number;
          shares: number;
          saves: number;
          notes: string;
          tracked_at: string;
          created_at: string;
        },
        {
          id?: string;
          content_piece_id: string;
          platform?: string;
          impressions?: number;
          engagements?: number;
          clicks?: number;
          shares?: number;
          saves?: number;
          notes?: string;
          tracked_at?: string;
          created_at?: string;
        },
        {
          id?: string;
          content_piece_id?: string;
          platform?: string;
          impressions?: number;
          engagements?: number;
          clicks?: number;
          shares?: number;
          saves?: number;
          notes?: string;
          tracked_at?: string;
          created_at?: string;
        }
      >;
      agent_messages: TableDef<
        {
          id: string;
          from_agent: string;
          to_agent: string;
          message_type: string;
          priority: string;
          title: string;
          body: string;
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          from_agent: string;
          to_agent: string;
          message_type?: string;
          priority?: string;
          title?: string;
          body?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          from_agent?: string;
          to_agent?: string;
          message_type?: string;
          priority?: string;
          title?: string;
          body?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      agent_tasks: TableDef<
        {
          id: string;
          assigned_agent: string;
          created_by: string;
          task_type: string;
          description: string;
          priority: string;
          status: string;
          due_date: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        },
        {
          id?: string;
          assigned_agent: string;
          created_by: string;
          task_type?: string;
          description?: string;
          priority?: string;
          status?: string;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        },
        {
          id?: string;
          assigned_agent?: string;
          created_by?: string;
          task_type?: string;
          description?: string;
          priority?: string;
          status?: string;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        }
      >;
      agent_profiles: TableDef<
        {
          id: string;
          agent_id: string;
          role: string;
          goal: string;
          responsibilities: string[];
          system_prompt: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          agent_id: string;
          role?: string;
          goal?: string;
          responsibilities?: string[];
          system_prompt?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          agent_id?: string;
          role?: string;
          goal?: string;
          responsibilities?: string[];
          system_prompt?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      agent_memory: TableDef<
        {
          id: string;
          agent_id: string;
          memory_key: string;
          memory_value: string;
          memory_type: string;
          importance: number;
          source_run_id: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          agent_id: string;
          memory_key: string;
          memory_value?: string;
          memory_type?: string;
          importance?: number;
          source_run_id?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          agent_id?: string;
          memory_key?: string;
          memory_value?: string;
          memory_type?: string;
          importance?: number;
          source_run_id?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      agent_conversations: TableDef<
        {
          id: string;
          agent_id: string;
          run_id: string;
          role: string;
          content: string;
          model: string;
          tokens_used: number | null;
          created_at: string;
        },
        {
          id?: string;
          agent_id: string;
          run_id: string;
          role: string;
          content?: string;
          model?: string;
          tokens_used?: number | null;
          created_at?: string;
        },
        {
          id?: string;
          agent_id?: string;
          run_id?: string;
          role?: string;
          content?: string;
          model?: string;
          tokens_used?: number | null;
          created_at?: string;
        }
      >;
      agent_decisions: TableDef<
        {
          id: string;
          agent_id: string;
          run_id: string;
          conversation_id: string | null;
          decision_type: string;
          title: string;
          input_summary: string;
          output_json: Json;
          reasoning: string;
          confidence: number;
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          agent_id: string;
          run_id: string;
          conversation_id?: string | null;
          decision_type?: string;
          title?: string;
          input_summary?: string;
          output_json?: Json;
          reasoning?: string;
          confidence?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          agent_id?: string;
          run_id?: string;
          conversation_id?: string | null;
          decision_type?: string;
          title?: string;
          input_summary?: string;
          output_json?: Json;
          reasoning?: string;
          confidence?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      agent_events: TableDef<
        {
          id: string;
          event_type: string;
          source_agent: string;
          target_agent: string | null;
          title: string;
          summary: string;
          impact: string;
          related_message_id: string | null;
          related_task_id: string | null;
          created_at: string;
        },
        {
          id?: string;
          event_type: string;
          source_agent: string;
          target_agent?: string | null;
          title?: string;
          summary?: string;
          impact?: string;
          related_message_id?: string | null;
          related_task_id?: string | null;
          created_at?: string;
        },
        {
          id?: string;
          event_type?: string;
          source_agent?: string;
          target_agent?: string | null;
          title?: string;
          summary?: string;
          impact?: string;
          related_message_id?: string | null;
          related_task_id?: string | null;
          created_at?: string;
        }
      >;
      integration_status: TableDef<
        {
          id: string;
          provider: string;
          status: string;
          configured: boolean;
          last_success_at: string | null;
          last_error_at: string | null;
          last_error_message: string;
          last_health_check_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          provider: string;
          status?: string;
          configured?: boolean;
          last_success_at?: string | null;
          last_error_at?: string | null;
          last_error_message?: string;
          last_health_check_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          provider?: string;
          status?: string;
          configured?: boolean;
          last_success_at?: string | null;
          last_error_at?: string | null;
          last_error_message?: string;
          last_health_check_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      integration_logs: TableDef<
        {
          id: string;
          provider: string;
          status: string;
          message: string;
          error: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          provider: string;
          status?: string;
          message?: string;
          error?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          provider?: string;
          status?: string;
          message?: string;
          error?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      api_rate_limits: TableDef<
        {
          id: string;
          provider: string;
          window_start: string;
          request_count: number;
          max_per_minute: number;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          provider: string;
          window_start?: string;
          request_count?: number;
          max_per_minute?: number;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          provider?: string;
          window_start?: string;
          request_count?: number;
          max_per_minute?: number;
          created_at?: string;
          updated_at?: string;
        }
      >;
      provider_health_checks: TableDef<
        {
          id: string;
          provider: string;
          status: string;
          message: string;
          duration_ms: number | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          provider: string;
          status?: string;
          message?: string;
          duration_ms?: number | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          provider?: string;
          status?: string;
          message?: string;
          duration_ms?: number | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      x_account_snapshots: TableDef<
        {
          id: string;
          follower_count: number;
          following_count: number;
          tweet_count: number;
          listed_count: number;
          username: string;
          display_name: string;
          snapshot_at: string;
          created_at: string;
        },
        {
          id?: string;
          follower_count?: number;
          following_count?: number;
          tweet_count?: number;
          listed_count?: number;
          username?: string;
          display_name?: string;
          snapshot_at?: string;
          created_at?: string;
        },
        {
          id?: string;
          follower_count?: number;
          following_count?: number;
          tweet_count?: number;
          listed_count?: number;
          username?: string;
          display_name?: string;
          snapshot_at?: string;
          created_at?: string;
        }
      >;
      x_posts: TableDef<
        {
          id: string;
          tweet_id: string;
          text: string;
          author_username: string;
          like_count: number;
          retweet_count: number;
          reply_count: number;
          impression_count: number;
          posted_at: string | null;
          is_plantpal: boolean;
          source: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          tweet_id: string;
          text?: string;
          author_username?: string;
          like_count?: number;
          retweet_count?: number;
          reply_count?: number;
          impression_count?: number;
          posted_at?: string | null;
          is_plantpal?: boolean;
          source?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          tweet_id?: string;
          text?: string;
          author_username?: string;
          like_count?: number;
          retweet_count?: number;
          reply_count?: number;
          impression_count?: number;
          posted_at?: string | null;
          is_plantpal?: boolean;
          source?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      x_post_queue: TableDef<
        {
          id: string;
          sprout_post_id: string | null;
          bloom_piece_id: string | null;
          text: string;
          status: string;
          engagement_score: number;
          gate_approved: boolean;
          sage_approved: boolean;
          published_tweet_id: string | null;
          error_message: string;
          scheduled_at: string | null;
          published_at: string | null;
          created_by_agent: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          sprout_post_id?: string | null;
          bloom_piece_id?: string | null;
          text?: string;
          status?: string;
          engagement_score?: number;
          gate_approved?: boolean;
          sage_approved?: boolean;
          published_tweet_id?: string | null;
          error_message?: string;
          scheduled_at?: string | null;
          published_at?: string | null;
          created_by_agent?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          sprout_post_id?: string | null;
          bloom_piece_id?: string | null;
          text?: string;
          status?: string;
          engagement_score?: number;
          gate_approved?: boolean;
          sage_approved?: boolean;
          published_tweet_id?: string | null;
          error_message?: string;
          scheduled_at?: string | null;
          published_at?: string | null;
          created_by_agent?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      pipeline_content: TableDef<
        {
          id: string;
          brief_id: string;
          platform: string;
          format: string;
          hook: string;
          caption: string;
          cta: string;
          viral_score: number;
          originality_score: number;
          humor_score: number;
          emotional_impact_score: number;
          shareability_score: number;
          educational_score: number;
          aggregate_score: number;
          director_notes: string;
          rewrite_count: number;
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          brief_id: string;
          platform: string;
          format: string;
          hook?: string;
          caption?: string;
          cta?: string;
          viral_score?: number;
          originality_score?: number;
          humor_score?: number;
          emotional_impact_score?: number;
          shareability_score?: number;
          educational_score?: number;
          aggregate_score?: number;
          director_notes?: string;
          rewrite_count?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          brief_id?: string;
          platform?: string;
          format?: string;
          hook?: string;
          caption?: string;
          cta?: string;
          viral_score?: number;
          originality_score?: number;
          humor_score?: number;
          emotional_impact_score?: number;
          shareability_score?: number;
          educational_score?: number;
          aggregate_score?: number;
          director_notes?: string;
          rewrite_count?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      daily_reports: TableDef<
        {
          id: string;
          report_date: string;
          summary: string;
          agent_productivity: Json;
          workflow_summary: Json;
          analytics_summary: Json;
          api_usage_summary: Json;
          growth_recommendations: Json;
          recommended_actions: Json;
          executive_summary?: Json;
          content_report?: Json;
          growth_report?: Json;
          action_plan?: Json;
          founder_review?: Json;
          intelligence_brief?: Json;
          created_at: string;
        },
        {
          id?: string;
          report_date?: string;
          summary?: string;
          agent_productivity?: Json;
          workflow_summary?: Json;
          analytics_summary?: Json;
          api_usage_summary?: Json;
          growth_recommendations?: Json;
          recommended_actions?: Json;
          executive_summary?: Json;
          content_report?: Json;
          growth_report?: Json;
          action_plan?: Json;
          founder_review?: Json;
          intelligence_brief?: Json;
          created_at?: string;
        },
        {
          id?: string;
          report_date?: string;
          summary?: string;
          agent_productivity?: Json;
          workflow_summary?: Json;
          analytics_summary?: Json;
          api_usage_summary?: Json;
          growth_recommendations?: Json;
          recommended_actions?: Json;
          executive_summary?: Json;
          content_report?: Json;
          growth_report?: Json;
          action_plan?: Json;
          founder_review?: Json;
          intelligence_brief?: Json;
          created_at?: string;
        }
      >;
      workflow_runs: TableDef<
        {
          id: string;
          workflow_name: string;
          source_agent: string;
          target_agent: string;
          status: string;
          items_moved: number;
          bottleneck: string;
          recommendation: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          workflow_name: string;
          source_agent: string;
          target_agent: string;
          status?: string;
          items_moved?: number;
          bottleneck?: string;
          recommendation?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          workflow_name?: string;
          source_agent?: string;
          target_agent?: string;
          status?: string;
          items_moved?: number;
          bottleneck?: string;
          recommendation?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      hq_workflow_events: TableDef<
        {
          id: string;
          workflow_name: string;
          source_agent: string;
          target_agent: string;
          trigger_type: string;
          trigger_id: string;
          status: string;
          started_at: string;
          completed_at: string | null;
          metadata: Json;
          created_at: string;
        },
        {
          id?: string;
          workflow_name: string;
          source_agent: string;
          target_agent: string;
          trigger_type: string;
          trigger_id?: string;
          status?: string;
          started_at?: string;
          completed_at?: string | null;
          metadata?: Json;
          created_at?: string;
        },
        {
          id?: string;
          workflow_name?: string;
          source_agent?: string;
          target_agent?: string;
          trigger_type?: string;
          trigger_id?: string;
          status?: string;
          started_at?: string;
          completed_at?: string | null;
          metadata?: Json;
          created_at?: string;
        }
      >;
      agent_schedules: TableDef<
        {
          id: string;
          agent_id: string;
          frequency_type: string;
          interval_hours: number | null;
          interval_minutes: number | null;
          daily_at_hour: number | null;
          daily_at_minute: number;
          enabled: boolean;
          last_run_at: string | null;
          next_run_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          agent_id: string;
          frequency_type: string;
          interval_hours?: number | null;
          interval_minutes?: number | null;
          daily_at_hour?: number | null;
          daily_at_minute?: number;
          enabled?: boolean;
          last_run_at?: string | null;
          next_run_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          agent_id?: string;
          frequency_type?: string;
          interval_hours?: number | null;
          interval_minutes?: number | null;
          daily_at_hour?: number | null;
          daily_at_minute?: number;
          enabled?: boolean;
          last_run_at?: string | null;
          next_run_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      agent_runs: TableDef<
        {
          id: string;
          agent_id: string;
          schedule_id: string | null;
          status: string;
          trigger_source: string;
          started_at: string;
          completed_at: string | null;
          duration_ms: number | null;
          items_processed: number;
          error_message: string | null;
          result_summary: Json;
          created_at: string;
        },
        {
          id?: string;
          agent_id: string;
          schedule_id?: string | null;
          status?: string;
          trigger_source?: string;
          started_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          items_processed?: number;
          error_message?: string | null;
          result_summary?: Json;
          created_at?: string;
        },
        {
          id?: string;
          agent_id?: string;
          schedule_id?: string | null;
          status?: string;
          trigger_source?: string;
          started_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          items_processed?: number;
          error_message?: string | null;
          result_summary?: Json;
          created_at?: string;
        }
      >;
      agent_health: TableDef<
        {
          id: string;
          agent_id: string;
          status: string;
          last_success_at: string | null;
          last_failure_at: string | null;
          last_error_message: string;
          consecutive_failures: number;
          total_runs: number;
          total_successes: number;
          total_failures: number;
          total_items_created: number;
          last_items_created: number;
          avg_duration_ms: number;
          updated_at: string;
        },
        {
          id?: string;
          agent_id: string;
          status?: string;
          last_success_at?: string | null;
          last_failure_at?: string | null;
          last_error_message?: string;
          consecutive_failures?: number;
          total_runs?: number;
          total_successes?: number;
          total_failures?: number;
          total_items_created?: number;
          last_items_created?: number;
          avg_duration_ms?: number;
          updated_at?: string;
        },
        {
          id?: string;
          agent_id?: string;
          status?: string;
          last_success_at?: string | null;
          last_failure_at?: string | null;
          last_error_message?: string;
          consecutive_failures?: number;
          total_runs?: number;
          total_successes?: number;
          total_failures?: number;
          total_items_created?: number;
          last_items_created?: number;
          avg_duration_ms?: number;
          updated_at?: string;
        }
      >;
      growth_action_items: TableDef<
        {
          id: string;
          title: string;
          description: string;
          priority: string;
          impact_score: number;
          effort_score: number;
          owner_agent: string;
          status: string;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title: string;
          description?: string;
          priority?: string;
          impact_score?: number;
          effort_score?: number;
          owner_agent?: string;
          status?: string;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          title?: string;
          description?: string;
          priority?: string;
          impact_score?: number;
          effort_score?: number;
          owner_agent?: string;
          status?: string;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
