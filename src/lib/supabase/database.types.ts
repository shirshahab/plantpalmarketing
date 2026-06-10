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
        },
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
        },
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
        }
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
        },
        {
          id?: string;
          platform: string;
          original_post?: string;
          draft?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          platform?: string;
          original_post?: string;
          draft?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
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
        },
        {
          id?: string;
          type?: string;
          channel?: string;
          draft?: string;
          status?: string;
          source_id?: string | null;
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
        },
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
        },
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
        }
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
