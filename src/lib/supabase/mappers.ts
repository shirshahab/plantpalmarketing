import type { Database } from "@/lib/supabase/database.types";
import type {
  DailyReport,
  GrowthActionItem,
  AgentProductivityEntry,
  WorkflowSummary,
  AnalyticsSummary,
  ApiUsageSummary,
  GrowthUpgradeRecommendation,
  RecommendedAction,
} from "@/lib/daily-report/types";
import type {
  AgentSchedule,
  AgentRun,
  AgentHealth,
  SchedulableAgent,
} from "@/lib/agent-worker/types";
import type {
  AgentActivityLog,
  AgentDailyBrief,
  BloomContentFormat,
  BloomContentPerformance,
  BloomContentPiece,
  BloomPieceStatus,
  BloomProductionRun,
  BloomSourceType,
  SageContentReview,
  SageRecommendation,
  SageReviewBatch,
  SproutPlatform,
  SproutPostStatus,
  SproutScheduledPost,
  OakPartnerType,
  OakPipelineStage,
  OakPartnershipDeal,
  IvyBrief,
  IvyBriefSections,
  IvyRecommendation,
  IvyAlert,
  AtlasGrowthMetrics,
  AtlasGrowthReport,
  AtlasGrowthReportSections,
  AtlasExperiment,
  AtlasRecommendation,
  AtlasForecast,
  AtlasBottleneck,
  FernOpportunity,
  FernExperiment,
  FernForecast,
  EchoFeedback,
  EchoFeatureRequest,
  EchoSentimentRecord,
  EchoLoveSignal,
  EchoChurnRisk,
  EchoReport,
  EchoReportSections,
  EchoFeedbackSource,
  EchoCategory,
  EchoFeedbackType,
  EchoSentiment,
  EchoChurnReason,
  EchoReportType,
  EchoFeatureTrend,
  AgentMessage,
  AgentTask,
  AgentEvent,
  AgentProfile,
  AgentMemory,
  AgentConversation,
  AgentDecision,
  AgentSlug,
  AgentMemoryType,
  AgentDecisionType,
  AgentDecisionStatus,
  ConversationRole,
  AgentMessageType,
  AgentMessageStatus,
  AgentTaskType,
  AgentTaskStatus,
  AgentEventType,
  CollaborationPriority,
  IntegrationProvider,
  IntegrationStatus,
  IntegrationLogStatus,
  IntegrationStatusRow,
  IntegrationLog,
  ApiRateLimitRow,
  ProviderHealthCheckRow,
  XAccountSnapshot,
  XPost,
  XPostQueueItem,
  XPostQueueStatus,
  FernTrafficSource,
  FernOpportunityType,
  AtlasGrowthStage,
  AtlasForecastHorizon,
  AtlasBottleneckType,
  AtlasExperimentEffort,
  AtlasExperimentStatus,
  AtlasRecommendationCategory,
  AtlasReportType,
  ApprovalItem,
  AutomationAction,
  AutomationRiskLevel,
  AutomationRule,
  AutomationRun,
  BatchApprovalItem,
  BatchApprovalItemType,
  BatchApprovalStatus,
  PublishingPackage,
  BriefStatus,
  CalendarApprovalStatus,
  CalendarPlatform,
  CalendarStatus,
  ContentAsset,
  ContentCalendarItem,
  ContentPublishLog,
  CommunityMention,
  CommunityOpportunity,
  CommunityReplyDraft,
  SourceInfo,
  CompetitorAlert,
  CompetitorDailyBrief,
  CompetitorIntelAlert,
  CompetitorIntelAlertType,
  CompetitorScoreboardEntry,
  ReviewTrend,
  CreatorLead,
  CreatorPartnership,
  CreatorPartnershipStatus,
  OpportunityType,
  Sentiment,
  ContentFormat,
  ContentIdea,
  CreativeContentIdea,
  CreativeContentType,
  CreativeOutputFormat,
  Creator,
  DiscoveryItemRecord,
  DiscoveryItemType,
  ImagePrompt,
  ImagePromptCategory,
  Partnership,
  PartnershipType,
  PipelineContent,
  PipelineStatus,
  ReplyDraft,
  SocialPost,
  Status,
  VideoScript,
} from "@/lib/types";

type Scene = { label: string; description: string };

function parseScenes(value: unknown): Scene[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is Scene => typeof s === "object" && s !== null && "label" in s)
    .map((s) => ({
      label: String(s.label),
      description: String((s as Scene).description ?? ""),
    }));
}

export function mapCreativeContentIdea(
  row: Database["public"]["Tables"]["creative_content_ideas"]["Row"]
): CreativeContentIdea {
  return {
    id: row.id,
    title: row.title,
    contentType: row.content_type as CreativeContentType,
    format: row.format as CreativeOutputFormat,
    hook: row.hook,
    emotionalTrigger: row.emotional_trigger,
    whyItWorks: row.why_it_works,
    cta: row.cta,
    difficultyScore: row.difficulty_score,
    viralScore: row.viral_score,
    body: row.body,
    status: row.status as Status,
    generationBatchId: row.generation_batch_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapContentIdea(row: Database["public"]["Tables"]["content_ideas"]["Row"]): ContentIdea {
  return {
    id: row.id,
    title: row.title,
    format: row.format as ContentFormat,
    hook: row.hook,
    body: row.body,
    status: row.status as Status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSocialPost(row: Database["public"]["Tables"]["social_posts"]["Row"]): SocialPost {
  return {
    id: row.id,
    platform: row.platform as SocialPost["platform"],
    caption: row.caption,
    hashtags: row.hashtags ?? [],
    status: row.status as Status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapImagePrompt(row: Database["public"]["Tables"]["image_prompts"]["Row"]): ImagePrompt {
  return {
    id: row.id,
    title: row.title,
    category: row.category as ImagePromptCategory,
    prompt: row.prompt,
    style: row.style,
    status: row.status as Status,
    sourceTable: row.source_table ?? "",
    metadata: (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapVideoScript(row: Database["public"]["Tables"]["video_scripts"]["Row"]): VideoScript {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform as VideoScript["platform"],
    hook: row.hook,
    scenes: parseScenes(row.scenes),
    onScreenText: row.on_screen_text ?? [],
    voiceover: row.voiceover,
    cta: row.cta,
    status: row.status as Status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

/**
 * Phase 34 — maps optional source attribution columns (migration 056).
 * Rows without a real source URL are treated as demo data.
 */
function mapSourceInfo(row: {
  source_url?: string;
  source_author?: string;
  source_author_url?: string;
  source_platform?: string;
  source_title?: string;
  source_subreddit?: string;
  source_created_at?: string | null;
  engagement?: unknown;
  data_source?: string;
  platform?: string;
  author?: string;
}): SourceInfo {
  const engagement: Record<string, number> = {};
  if (row.engagement && typeof row.engagement === "object" && !Array.isArray(row.engagement)) {
    for (const [key, value] of Object.entries(row.engagement as Record<string, unknown>)) {
      if (typeof value === "number") engagement[key] = value;
    }
  }
  const sourceUrl = row.source_url ?? "";
  return {
    sourceUrl,
    sourceAuthor: row.source_author || row.author || "",
    sourceAuthorUrl: row.source_author_url ?? "",
    sourcePlatform: row.source_platform || row.platform || "",
    sourceTitle: row.source_title ?? "",
    sourceSubreddit: row.source_subreddit ?? "",
    sourceCreatedAt: row.source_created_at ?? null,
    engagement,
    dataSource: row.data_source || (sourceUrl ? "live_api" : "demo"),
  };
}

export function mapCommunityOpportunity(
  row: Database["public"]["Tables"]["community_opportunities"]["Row"]
): CommunityOpportunity {
  return {
    id: row.id,
    platform: row.platform as CommunityOpportunity["platform"],
    author: row.author,
    post: row.post,
    topic: row.topic,
    question: row.question ?? "",
    sentiment: (row.sentiment ?? "neutral") as Sentiment,
    urgencyScore: row.urgency_score,
    opportunityScore: row.opportunity_score ?? 50,
    opportunityType: (row.opportunity_type ?? "beginner_questions") as OpportunityType,
    suggestedReply: row.suggested_reply,
    mentionId: row.mention_id,
    status: row.status as Status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...mapSourceInfo(row),
  };
}

export function mapCreatorLead(
  row: Database["public"]["Tables"]["creator_leads"]["Row"]
): CreatorLead {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    platform: row.platform,
    category: row.category,
    followers: row.followers,
    engagementRate: Number(row.engagement_rate),
    averageViews: row.average_views,
    location: row.location,
    email: row.email,
    website: row.website,
    partnershipScore: row.partnership_score,
    audienceFit: row.audience_fit,
    engagementScore: row.engagement_score,
    postingFrequency: row.posting_frequency,
    contentQuality: row.content_quality,
    growthTrend: row.growth_trend,
    partnershipStatus: row.partnership_status as CreatorPartnershipStatus,
    priority: row.priority as "normal" | "high",
    source: row.source,
    suggestedIdeas: parseStringArray(row.suggested_ideas),
    notes: row.notes,
    status: row.status as Status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCreatorPartnership(
  row: Database["public"]["Tables"]["creator_partnerships"]["Row"]
): CreatorPartnership {
  return {
    id: row.id,
    creatorLeadId: row.creator_lead_id,
    title: row.title,
    ideaType: row.idea_type as CreatorPartnership["ideaType"],
    description: row.description,
    status: row.status as CreatorPartnership["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCommunityMention(
  row: Database["public"]["Tables"]["community_mentions"]["Row"]
): CommunityMention {
  return {
    id: row.id,
    platform: row.platform,
    author: row.author,
    content: row.content,
    url: row.url,
    sentiment: row.sentiment as Sentiment,
    processed: row.processed,
    createdAt: row.created_at,
  };
}

export function mapCommunityReplyDraft(
  row: Database["public"]["Tables"]["community_reply_drafts"]["Row"]
): CommunityReplyDraft {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    platform: row.platform,
    author: row.author,
    originalContent: row.original_content,
    draft: row.draft,
    status: row.status as Status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...mapSourceInfo(row),
  };
}

export function mapCompetitorScoreboard(
  row: Database["public"]["Tables"]["competitor_scoreboard"]["Row"]
): CompetitorScoreboardEntry {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    estimatedGrowth: row.estimated_growth,
    appStoreRank: row.app_store_rank,
    appStoreCategory: row.app_store_category,
    reviewTrend: row.review_trend as ReviewTrend,
    reviewScore: Number(row.review_score),
    socialEngagementScore: row.social_engagement_score,
    newFeaturesCount: row.new_features_count,
    recentCampaigns: parseStringArray(row.recent_campaigns),
    threatLevel: row.threat_level,
    opportunityLevel: row.opportunity_level,
    notes: row.notes,
    lastScannedAt: row.last_scanned_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCompetitorIntelAlert(
  row: Database["public"]["Tables"]["competitor_intel_alerts"]["Row"]
): CompetitorIntelAlert {
  return {
    id: row.id,
    competitor: row.competitor,
    alertType: row.alert_type as CompetitorIntelAlertType,
    title: row.title,
    description: row.description,
    severity: row.severity as CompetitorIntelAlert["severity"],
    source: row.source,
    recommendedAction: row.recommended_action,
    status: row.status as CompetitorIntelAlert["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCompetitorDailyBrief(
  row: Database["public"]["Tables"]["competitor_daily_briefs"]["Row"]
): CompetitorDailyBrief {
  return {
    id: row.id,
    briefDate: row.brief_date,
    biggestThreat: row.biggest_threat,
    biggestOpportunity: row.biggest_opportunity,
    recommendedResponse: row.recommended_response,
    alertsCount: row.alerts_count,
    competitorsScanned: row.competitors_scanned,
    status: row.status as CompetitorDailyBrief["status"],
    createdAt: row.created_at,
  };
}

export function mapBloomProductionRun(
  row: Database["public"]["Tables"]["bloom_production_runs"]["Row"]
): BloomProductionRun {
  return {
    id: row.id,
    runDate: row.run_date,
    status: row.status as BloomProductionRun["status"],
    piecesGenerated: row.pieces_generated,
    piecesQueued: row.pieces_queued,
    scoutInputs: row.scout_inputs,
    rootsInputs: row.roots_inputs,
    sentinelInputs: row.sentinel_inputs,
    seasonalInputs: row.seasonal_inputs,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBloomContentPiece(
  row: Database["public"]["Tables"]["bloom_content_pieces"]["Row"]
): BloomContentPiece {
  return {
    id: row.id,
    runId: row.run_id,
    format: row.format as BloomContentFormat,
    platform: row.platform,
    title: row.title,
    hook: row.hook,
    caption: row.caption,
    cta: row.cta,
    viralScore: row.viral_score,
    emotionalTrigger: row.emotional_trigger,
    difficultyScore: row.difficulty_score,
    sourceType: row.source_type as BloomSourceType,
    sourceDetail: row.source_detail,
    scheduledDate: row.scheduled_date,
    status: row.status as BloomPieceStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBloomContentPerformance(
  row: Database["public"]["Tables"]["bloom_content_performance"]["Row"],
  piece?: BloomContentPiece
): BloomContentPerformance {
  return {
    id: row.id,
    contentPieceId: row.content_piece_id,
    platform: row.platform,
    impressions: row.impressions,
    engagements: row.engagements,
    clicks: row.clicks,
    shares: row.shares,
    saves: row.saves,
    notes: row.notes,
    trackedAt: row.tracked_at,
    createdAt: row.created_at,
    piece,
  };
}

export function mapSageReviewBatch(
  row: Database["public"]["Tables"]["sage_review_batches"]["Row"]
): SageReviewBatch {
  return {
    id: row.id,
    runDate: row.run_date,
    status: row.status as SageReviewBatch["status"],
    piecesReviewed: row.pieces_reviewed,
    approvedCount: row.approved_count,
    rejectedCount: row.rejected_count,
    avgAggregateScore: Number(row.avg_aggregate_score),
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSageContentReview(
  row: Database["public"]["Tables"]["sage_content_reviews"]["Row"],
  piece?: BloomContentPiece
): SageContentReview {
  return {
    id: row.id,
    batchId: row.batch_id,
    bloomPieceId: row.bloom_piece_id,
    originalityScore: row.originality_score,
    humorScore: row.humor_score,
    emotionalImpactScore: row.emotional_impact_score,
    shareabilityScore: row.shareability_score,
    storytellingScore: row.storytelling_score,
    educationalScore: row.educational_score,
    aggregateScore: row.aggregate_score,
    recommendation: row.recommendation as SageRecommendation,
    rejectionReason: row.rejection_reason,
    hookSuggestion: row.hook_suggestion,
    ctaSuggestion: row.cta_suggestion,
    storytellingSuggestion: row.storytelling_suggestion,
    creativeOpportunity: row.creative_opportunity,
    status: row.status as SageContentReview["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    piece,
  };
}

export function mapSproutScheduledPost(
  row: Database["public"]["Tables"]["sprout_scheduled_posts"]["Row"]
): SproutScheduledPost {
  return {
    id: row.id,
    bloomPieceId: row.bloom_piece_id,
    approvalQueueId: row.approval_queue_id,
    platform: row.platform as SproutPlatform,
    title: row.title,
    hook: row.hook,
    caption: row.caption,
    cta: row.cta,
    scheduledAt: row.scheduled_at,
    recommendedTimeLabel: row.recommended_time_label,
    bestTimeScore: row.best_time_score,
    timezone: row.timezone,
    status: row.status as SproutPostStatus,
    scheduleApproved: row.schedule_approved,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseIvySections(raw: unknown): IvyBriefSections {
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<IvyBriefSections>;
  return {
    executiveSummary: s.executiveSummary ?? "",
    topOpportunities: Array.isArray(s.topOpportunities) ? s.topOpportunities : [],
    highestPriorityApproval: s.highestPriorityApproval ?? "",
    bestCreatorFound: s.bestCreatorFound ?? "",
    bestPartnershipOpportunity: s.bestPartnershipOpportunity ?? "",
    biggestCompetitorThreat: s.biggestCompetitorThreat ?? "",
    bestContentCreated: s.bestContentCreated ?? "",
    communityTrends: Array.isArray(s.communityTrends) ? s.communityTrends : [],
    recommendedActions: Array.isArray(s.recommendedActions) ? s.recommendedActions : [],
  };
}

export function mapIvyBrief(row: Database["public"]["Tables"]["ivy_briefs"]["Row"]): IvyBrief {
  return {
    id: row.id,
    briefType: row.brief_type as IvyBrief["briefType"],
    runDate: row.run_date,
    executiveSummary: row.executive_summary,
    sections: parseIvySections(row.sections),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapIvyRecommendation(
  row: Database["public"]["Tables"]["ivy_recommendations"]["Row"]
): IvyRecommendation {
  return {
    id: row.id,
    category: row.category as IvyRecommendation["category"],
    title: row.title,
    description: row.description,
    priorityScore: row.priority_score,
    revenueImpact: row.revenue_impact,
    growthImpact: row.growth_impact,
    viralityPotential: row.virality_potential,
    timeSensitivity: row.time_sensitivity,
    sourceAgent: row.source_agent,
    sourceEntityId: row.source_entity_id,
    status: row.status as IvyRecommendation["status"],
    briefDate: row.brief_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapIvyAlert(row: Database["public"]["Tables"]["ivy_alerts"]["Row"]): IvyAlert {
  return {
    id: row.id,
    alertType: row.alert_type as IvyAlert["alertType"],
    title: row.title,
    description: row.description,
    priorityScore: row.priority_score,
    sourceAgent: row.source_agent,
    sourceEntityId: row.source_entity_id,
    status: row.status as IvyAlert["status"],
    briefDate: row.brief_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseAtlasReportSections(raw: unknown): AtlasGrowthReportSections {
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<AtlasGrowthReportSections>;
  return {
    biggestOpportunity: s.biggestOpportunity ?? "",
    biggestRisk: s.biggestRisk ?? "",
    fastestWin: s.fastestWin ?? "",
    bestPerformingChannel: s.bestPerformingChannel ?? "",
    worstPerformingChannel: s.worstPerformingChannel ?? "",
    recommendedAction: s.recommendedAction ?? "",
    totalUsers: s.totalUsers,
    growthStage: s.growthStage as AtlasGrowthStage | undefined,
    whatWorked: Array.isArray(s.whatWorked) ? s.whatWorked : undefined,
    whatFailed: Array.isArray(s.whatFailed) ? s.whatFailed : undefined,
    doubleDown: Array.isArray(s.doubleDown) ? s.doubleDown : undefined,
    stopDoing: Array.isArray(s.stopDoing) ? s.stopDoing : undefined,
  };
}

export function mapAtlasGrowthMetrics(
  row: Database["public"]["Tables"]["atlas_growth_metrics"]["Row"]
): AtlasGrowthMetrics {
  const channels =
    row.channel_breakdown && typeof row.channel_breakdown === "object"
      ? (row.channel_breakdown as Record<string, number>)
      : {};
  return {
    id: row.id,
    snapshotDate: row.snapshot_date,
    totalUsers: row.total_users,
    totalInstalls: row.total_installs,
    waitlistCount: row.waitlist_count,
    weeklyActiveUsers: row.weekly_active_users,
    monthlyActiveUsers: row.monthly_active_users,
    trafficSessions: row.traffic_sessions,
    conversionRate: Number(row.conversion_rate),
    engagementRate: Number(row.engagement_rate),
    retentionD7: Number(row.retention_d7),
    retentionD30: Number(row.retention_d30),
    growthStage: row.growth_stage as AtlasGrowthStage,
    channelBreakdown: channels,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAtlasGrowthReport(
  row: Database["public"]["Tables"]["atlas_growth_reports"]["Row"]
): AtlasGrowthReport {
  return {
    id: row.id,
    reportType: row.report_type as AtlasReportType,
    runDate: row.run_date,
    executiveSummary: row.executive_summary,
    sections: parseAtlasReportSections(row.sections),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAtlasExperiment(
  row: Database["public"]["Tables"]["atlas_experiments"]["Row"]
): AtlasExperiment {
  return {
    id: row.id,
    name: row.name,
    hypothesis: row.hypothesis,
    expectedOutcome: row.expected_outcome,
    effort: row.effort as AtlasExperimentEffort,
    impact: row.impact,
    priorityScore: row.priority_score,
    status: row.status as AtlasExperimentStatus,
    results: row.results,
    reportDate: row.report_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAtlasRecommendation(
  row: Database["public"]["Tables"]["atlas_recommendations"]["Row"]
): AtlasRecommendation {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as AtlasRecommendationCategory,
    reach: row.reach,
    cost: row.cost,
    difficulty: row.difficulty,
    virality: row.virality,
    revenuePotential: row.revenue_potential,
    retentionPotential: row.retention_potential,
    priorityScore: row.priority_score,
    sourceAgent: row.source_agent,
    reportDate: row.report_date,
    status: row.status as AtlasRecommendation["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAtlasForecast(
  row: Database["public"]["Tables"]["atlas_forecasts"]["Row"]
): AtlasForecast {
  return {
    id: row.id,
    horizon: row.horizon as AtlasForecastHorizon,
    predictedUsers: row.predicted_users,
    predictedInstalls: row.predicted_installs,
    growthRatePct: Number(row.growth_rate_pct),
    confidence: row.confidence,
    assumptions: row.assumptions,
    reportDate: row.report_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAtlasBottleneck(
  row: Database["public"]["Tables"]["atlas_bottlenecks"]["Row"]
): AtlasBottleneck {
  return {
    id: row.id,
    bottleneckType: row.bottleneck_type as AtlasBottleneckType,
    title: row.title,
    description: row.description,
    severity: row.severity as AtlasBottleneck["severity"],
    suggestedFix: row.suggested_fix,
    metricValue: row.metric_value != null ? Number(row.metric_value) : null,
    benchmarkValue: row.benchmark_value != null ? Number(row.benchmark_value) : null,
    status: row.status as AtlasBottleneck["status"],
    reportDate: row.report_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseEchoReportSections(raw: unknown): EchoReportSections {
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<EchoReportSections>;
  return {
    topComplaints: Array.isArray(s.topComplaints) ? s.topComplaints : [],
    topFeatureRequests: Array.isArray(s.topFeatureRequests) ? s.topFeatureRequests : [],
    topPositiveFeedback: Array.isArray(s.topPositiveFeedback) ? s.topPositiveFeedback : [],
    urgentIssues: Array.isArray(s.urgentIssues) ? s.urgentIssues : [],
    recommendedActions: Array.isArray(s.recommendedActions) ? s.recommendedActions : [],
    whatUsersLove: Array.isArray(s.whatUsersLove) ? s.whatUsersLove : undefined,
    whatUsersHate: Array.isArray(s.whatUsersHate) ? s.whatUsersHate : undefined,
    whatUsersWantNext: Array.isArray(s.whatUsersWantNext) ? s.whatUsersWantNext : undefined,
    biggestRetentionRisks: Array.isArray(s.biggestRetentionRisks) ? s.biggestRetentionRisks : undefined,
    productRecommendations: Array.isArray(s.productRecommendations) ? s.productRecommendations : undefined,
  };
}

export function mapEchoFeedback(row: Database["public"]["Tables"]["echo_feedback"]["Row"]): EchoFeedback {
  return {
    id: row.id,
    source: row.source as EchoFeedbackSource,
    category: row.category as EchoCategory,
    feedbackType: row.feedback_type as EchoFeedbackType,
    sentiment: row.sentiment as EchoSentiment,
    content: row.content,
    author: row.author,
    rating: row.rating,
    reportDate: row.report_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEchoFeatureRequest(
  row: Database["public"]["Tables"]["echo_feature_requests"]["Row"]
): EchoFeatureRequest {
  return {
    id: row.id,
    featureName: row.feature_name,
    category: row.category,
    description: row.description,
    frequency: row.frequency,
    priority: row.priority,
    impact: row.impact,
    estimatedDemand: row.estimated_demand,
    trend: row.trend as EchoFeatureTrend,
    status: row.status as EchoFeatureRequest["status"],
    reportDate: row.report_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEchoSentiment(
  row: Database["public"]["Tables"]["echo_sentiment"]["Row"]
): EchoSentimentRecord {
  return {
    id: row.id,
    snapshotDate: row.snapshot_date,
    positiveCount: row.positive_count,
    neutralCount: row.neutral_count,
    negativeCount: row.negative_count,
    urgentCount: row.urgent_count,
    positivePct: Number(row.positive_pct),
    negativePct: Number(row.negative_pct),
    trendDirection: row.trend_direction as EchoSentimentRecord["trendDirection"],
    topCategory: row.top_category,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEchoLoveSignal(
  row: Database["public"]["Tables"]["echo_love_signals"]["Row"]
): EchoLoveSignal {
  return {
    id: row.id,
    feature: row.feature,
    quote: row.quote,
    source: row.source,
    category: row.category,
    marketingPotential: row.marketing_potential,
    testimonialReady: row.testimonial_ready,
    ambassadorPotential: row.ambassador_potential,
    reportDate: row.report_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEchoChurnRisk(
  row: Database["public"]["Tables"]["echo_churn_risks"]["Row"]
): EchoChurnRisk {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    churnReason: row.churn_reason as EchoChurnReason,
    severity: row.severity as EchoChurnRisk["severity"],
    affectedUsersEstimate: row.affected_users_estimate,
    suggestedAction: row.suggested_action,
    status: row.status as EchoChurnRisk["status"],
    reportDate: row.report_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEchoReport(row: Database["public"]["Tables"]["echo_reports"]["Row"]): EchoReport {
  return {
    id: row.id,
    reportType: row.report_type as EchoReportType,
    runDate: row.run_date,
    executiveSummary: row.executive_summary,
    sections: parseEchoReportSections(row.sections),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFernOpportunity(
  row: Database["public"]["Tables"]["fern_opportunities"]["Row"]
): FernOpportunity {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    trafficSource: row.traffic_source as FernTrafficSource,
    opportunityType: row.opportunity_type as FernOpportunityType,
    reach: row.reach,
    cost: row.cost,
    difficulty: row.difficulty,
    virality: row.virality,
    estimatedInstalls: row.estimated_installs,
    priorityScore: row.priority_score,
    sourceAgent: row.source_agent,
    reportDate: row.report_date,
    status: row.status as FernOpportunity["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFernExperiment(
  row: Database["public"]["Tables"]["fern_experiments"]["Row"]
): FernExperiment {
  return {
    id: row.id,
    name: row.name,
    hypothesis: row.hypothesis,
    effort: row.effort as FernExperiment["effort"],
    expectedImpact: row.expected_impact,
    status: row.status as FernExperiment["status"],
    results: row.results,
    reportDate: row.report_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFernForecast(
  row: Database["public"]["Tables"]["fern_forecasts"]["Row"]
): FernForecast {
  return {
    id: row.id,
    horizon: row.horizon as FernForecast["horizon"],
    trafficSource: row.traffic_source,
    predictedInstalls: row.predicted_installs,
    confidence: row.confidence,
    assumptions: row.assumptions,
    reportDate: row.report_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapOakPartnershipDeal(
  row: Database["public"]["Tables"]["oak_partnership_pipeline"]["Row"]
): OakPartnershipDeal {
  return {
    id: row.id,
    creatorLeadId: row.creator_lead_id,
    partnerName: row.partner_name,
    partnerType: row.partner_type as OakPartnerType,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    location: row.location,
    stage: row.stage as OakPipelineStage,
    outreachDraft: row.outreach_draft,
    collaborationIdea: row.collaboration_idea,
    followUpAt: row.follow_up_at,
    followUpNote: row.follow_up_note,
    revenueGenerated: Number(row.revenue_generated),
    installsGenerated: row.installs_generated,
    priority: row.priority as "normal" | "high",
    notes: row.notes,
    outreachApproved: row.outreach_approved,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAgentActivityLog(
  row: Database["public"]["Tables"]["agent_activity_log"]["Row"]
): AgentActivityLog {
  return {
    id: row.id,
    agentId: row.agent_id as "scout" | "roots" | "sentinel" | "bloom" | "sage" | "sprout" | "oak",
    action: row.action,
    detail: row.detail,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  };
}

export function mapReplyDraft(row: Database["public"]["Tables"]["reply_drafts"]["Row"]): ReplyDraft {
  return {
    id: row.id,
    platform: row.platform as ReplyDraft["platform"],
    originalPost: row.original_post,
    draft: row.draft,
    status: row.status as Status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...mapSourceInfo(row),
  };
}

export function mapCreator(row: Database["public"]["Tables"]["creators"]["Row"]): Creator {
  return {
    id: row.id,
    name: row.name,
    platform: row.platform as Creator["platform"],
    niche: row.niche,
    followers: row.followers,
    engagementRate: Number(row.engagement_rate),
    email: row.email,
    status: row.status as Creator["status"],
    notes: row.notes,
    partnershipIdea: row.partnership_idea,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPartnership(row: Database["public"]["Tables"]["partnerships"]["Row"]): Partnership {
  return {
    id: row.id,
    name: row.name,
    type: row.type as PartnershipType,
    contact: row.contact,
    location: row.location,
    status: row.status as Partnership["status"],
    notes: row.notes,
    opportunity: row.opportunity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCompetitorAlert(
  row: Database["public"]["Tables"]["competitor_alerts"]["Row"]
): CompetitorAlert {
  return {
    id: row.id,
    competitor: row.competitor,
    type: row.type as CompetitorAlert["type"],
    title: row.title,
    description: row.description,
    severity: row.severity as CompetitorAlert["severity"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapApprovalItem(row: Database["public"]["Tables"]["approval_queue"]["Row"]): ApprovalItem {
  return {
    id: row.id,
    type: row.type as ApprovalItem["type"],
    channel: row.channel,
    draft: row.draft,
    status: row.status as Status,
    sourceId: row.source_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Phase 33 — optional until migration 054 runs
    sourcePlatform: row.source_platform ?? "",
    sourceUrl: row.source_url ?? "",
    sourceAuthor: row.source_author ?? "",
    sourceAuthorUrl: row.source_author_url ?? "",
    sourceTitle: row.source_title ?? "",
    sourceExcerpt: row.source_excerpt ?? "",
    dataSource: row.data_source ?? "manual",
  };
}

export function mapAgentDailyBrief(
  row: Database["public"]["Tables"]["agent_daily_briefs"]["Row"]
): AgentDailyBrief {
  return {
    id: row.id,
    briefDate: row.brief_date ?? row.run_date,
    title: row.title ?? "",
    summary: row.summary ?? "",
    agentProductivity: (row.agent_productivity as unknown as Record<string, unknown>[]) ?? [],
    workflowSummary: (row.workflow_summary as unknown as Record<string, unknown>) ?? {},
    apiUsageSummary: (row.api_usage_summary as unknown as Record<string, unknown>) ?? {},
    analyticsSummary: (row.analytics_summary as unknown as Record<string, unknown>) ?? {},
    recommendations: (row.recommendations as unknown as Record<string, unknown>[]) ?? [],
    createdByAgent: row.created_by_agent ?? "ivy",
    runDate: row.run_date,
    status: row.status as BriefStatus,
    discoverySummary: row.discovery_summary,
    contentCount: row.content_count,
    approvedCount: row.approved_count,
    rejectedCount: row.rejected_count,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapContentCalendarItem(
  row: Database["public"]["Tables"]["content_calendar"]["Row"]
): ContentCalendarItem {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform as CalendarPlatform,
    channel: row.channel,
    contentType: row.content_type,
    caption: row.caption,
    hook: row.hook,
    cta: row.cta,
    assetUrl: row.asset_url,
    assetType: row.asset_type,
    assetPrompt: row.asset_prompt,
    scheduledFor: row.scheduled_for,
    publishedAt: row.published_at,
    status: row.status as CalendarStatus,
    approvalStatus: row.approval_status as CalendarApprovalStatus,
    sourceAgent: row.source_agent,
    sourceTable: row.source_table,
    sourceId: row.source_id,
    copyText: row.copy_text,
    platformUrl: row.platform_url,
    notes: row.notes,
    metadata: (row.metadata as unknown as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapContentAsset(
  row: Database["public"]["Tables"]["content_assets"]["Row"]
): ContentAsset {
  return {
    id: row.id,
    calendarItemId: row.calendar_item_id,
    assetType: row.asset_type,
    assetUrl: row.asset_url,
    assetPrompt: row.asset_prompt,
    thumbnailUrl: row.thumbnail_url,
    status: row.status as ContentAsset["status"],
    createdByAgent: row.created_by_agent,
    metadata: (row.metadata as unknown as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  };
}

export function mapAutomationRule(
  row: Database["public"]["Tables"]["automation_rules"]["Row"]
): AutomationRule {
  return {
    id: row.id,
    ruleKey: row.rule_key,
    label: row.label,
    description: row.description,
    agentId: row.agent_id,
    category: row.category,
    riskLevel: row.risk_level as AutomationRiskLevel,
    action: row.action as AutomationAction,
    enabled: row.enabled,
    config: (row.config as unknown as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAutomationRun(
  row: Database["public"]["Tables"]["automation_runs"]["Row"]
): AutomationRun {
  return {
    id: row.id,
    ruleKey: row.rule_key,
    agentId: row.agent_id,
    action: row.action,
    status: row.status as AutomationRun["status"],
    itemsProcessed: row.items_processed,
    itemsCreated: row.items_created,
    detail: row.detail,
    errorMessage: row.error_message,
    metadata: (row.metadata as unknown as Record<string, unknown>) ?? {},
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

export function mapPublishingPackage(
  row: Database["public"]["Tables"]["publishing_packages"]["Row"]
): PublishingPackage {
  return {
    id: row.id,
    calendarItemId: row.calendar_item_id,
    platform: row.platform as CalendarPlatform,
    caption: row.caption,
    script: row.script,
    hashtags: (row.hashtags as unknown as string[]) ?? [],
    assetPrompt: row.asset_prompt,
    assetUrl: row.asset_url,
    thumbnailUrl: row.thumbnail_url,
    uploadChecklist: (row.upload_checklist as unknown as string[]) ?? [],
    recommendedPostTime: row.recommended_post_time,
    recommendedPostAt: row.recommended_post_at,
    platformNotes: row.platform_notes,
    copyText: row.copy_text,
    status: row.status as PublishingPackage["status"],
    metadata: (row.metadata as unknown as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBatchApprovalItem(
  row: Database["public"]["Tables"]["batch_approvals"]["Row"]
): BatchApprovalItem {
  return {
    id: row.id,
    batchDate: row.batch_date,
    itemType: row.item_type as BatchApprovalItemType,
    riskLevel: row.risk_level as AutomationRiskLevel,
    platform: row.platform,
    title: row.title,
    content: row.content,
    sourceTable: row.source_table,
    sourceId: row.source_id,
    calendarItemId: row.calendar_item_id,
    status: row.status as BatchApprovalStatus,
    decidedAt: row.decided_at,
    metadata: (row.metadata as unknown as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapContentPublishLog(
  row: Database["public"]["Tables"]["content_publish_logs"]["Row"]
): ContentPublishLog {
  return {
    id: row.id,
    calendarItemId: row.calendar_item_id,
    platform: row.platform,
    status: row.status as ContentPublishLog["status"],
    publishedUrl: row.published_url,
    errorMessage: row.error_message,
    metadata: (row.metadata as unknown as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  };
}

export function mapDiscoveryItem(
  row: Database["public"]["Tables"]["discovery_items"]["Row"]
): DiscoveryItemRecord {
  return {
    id: row.id,
    briefId: row.brief_id,
    itemType: row.item_type as DiscoveryItemType,
    title: row.title,
    description: row.description,
    source: row.source,
    relevanceScore: row.relevance_score,
    createdAt: row.created_at,
  };
}

export function mapPipelineContent(
  row: Database["public"]["Tables"]["pipeline_content"]["Row"]
): PipelineContent {
  return {
    id: row.id,
    briefId: row.brief_id,
    platform: row.platform,
    format: row.format,
    hook: row.hook,
    caption: row.caption,
    cta: row.cta,
    viralScore: row.viral_score,
    originalityScore: row.originality_score,
    humorScore: row.humor_score,
    emotionalImpactScore: row.emotional_impact_score,
    shareabilityScore: row.shareability_score,
    educationalScore: row.educational_score,
    aggregateScore: row.aggregate_score,
    directorNotes: row.director_notes,
    rewriteCount: row.rewrite_count,
    status: row.status as PipelineStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAgentMessage(
  row: Database["public"]["Tables"]["agent_messages"]["Row"]
): AgentMessage {
  return {
    id: row.id,
    fromAgent: row.from_agent as AgentSlug,
    toAgent: row.to_agent as AgentSlug,
    messageType: row.message_type as AgentMessageType,
    priority: row.priority as CollaborationPriority,
    title: row.title,
    body: row.body,
    status: row.status as AgentMessageStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAgentTask(
  row: Database["public"]["Tables"]["agent_tasks"]["Row"]
): AgentTask {
  return {
    id: row.id,
    assignedAgent: row.assigned_agent as AgentSlug,
    createdBy: row.created_by as AgentSlug,
    taskType: row.task_type as AgentTaskType,
    description: row.description,
    priority: row.priority as CollaborationPriority,
    status: row.status as AgentTaskStatus,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

export function mapAgentEvent(
  row: Database["public"]["Tables"]["agent_events"]["Row"]
): AgentEvent {
  return {
    id: row.id,
    eventType: row.event_type as AgentEventType,
    sourceAgent: row.source_agent as AgentSlug,
    targetAgent: row.target_agent as AgentSlug | null,
    title: row.title,
    summary: row.summary,
    impact: row.impact,
    relatedMessageId: row.related_message_id,
    relatedTaskId: row.related_task_id,
    createdAt: row.created_at,
  };
}

export function mapAgentProfile(
  row: Database["public"]["Tables"]["agent_profiles"]["Row"]
): AgentProfile {
  return {
    id: row.id,
    agentId: row.agent_id as AgentSlug,
    role: row.role,
    goal: row.goal,
    responsibilities: row.responsibilities ?? [],
    systemPrompt: row.system_prompt,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAgentMemory(
  row: Database["public"]["Tables"]["agent_memory"]["Row"]
): AgentMemory {
  return {
    id: row.id,
    agentId: row.agent_id as AgentSlug,
    memoryKey: row.memory_key,
    memoryValue: row.memory_value,
    memoryType: row.memory_type as AgentMemoryType,
    importance: row.importance,
    sourceRunId: row.source_run_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAgentConversation(
  row: Database["public"]["Tables"]["agent_conversations"]["Row"]
): AgentConversation {
  return {
    id: row.id,
    agentId: row.agent_id as AgentSlug,
    runId: row.run_id,
    role: row.role as ConversationRole,
    content: row.content,
    model: row.model,
    tokensUsed: row.tokens_used,
    createdAt: row.created_at,
  };
}

export function mapAgentDecision(
  row: Database["public"]["Tables"]["agent_decisions"]["Row"]
): AgentDecision {
  return {
    id: row.id,
    agentId: row.agent_id as AgentSlug,
    runId: row.run_id,
    conversationId: row.conversation_id,
    decisionType: row.decision_type as AgentDecisionType,
    title: row.title,
    inputSummary: row.input_summary,
    outputJson: (row.output_json ?? {}) as Record<string, unknown>,
    reasoning: row.reasoning,
    confidence: row.confidence,
    status: row.status as AgentDecisionStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapIntegrationStatus(
  row: Database["public"]["Tables"]["integration_status"]["Row"]
): IntegrationStatusRow {
  return {
    id: row.id,
    provider: row.provider as IntegrationProvider,
    status: row.status as IntegrationStatus,
    configured: row.configured,
    lastSuccessAt: row.last_success_at,
    lastErrorAt: row.last_error_at,
    lastErrorMessage: row.last_error_message,
    lastHealthCheckAt: row.last_health_check_at,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** @deprecated Use mapIntegrationStatus */
export const mapIntegrationProviderStatus = mapIntegrationStatus;

export function mapIntegrationLog(
  row: Database["public"]["Tables"]["integration_logs"]["Row"]
): IntegrationLog {
  return {
    id: row.id,
    provider: row.provider as IntegrationProvider,
    status: row.status as IntegrationLogStatus,
    message: row.message,
    error: row.error,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapApiRateLimit(
  row: Database["public"]["Tables"]["api_rate_limits"]["Row"]
): ApiRateLimitRow {
  return {
    id: row.id,
    provider: row.provider as IntegrationProvider,
    windowStart: row.window_start,
    requestCount: row.request_count,
    maxPerMinute: row.max_per_minute,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProviderHealthCheck(
  row: Database["public"]["Tables"]["provider_health_checks"]["Row"]
): ProviderHealthCheckRow {
  return {
    id: row.id,
    provider: row.provider as IntegrationProvider,
    status: row.status as IntegrationStatus,
    message: row.message,
    durationMs: row.duration_ms,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapXAccountSnapshot(
  row: Database["public"]["Tables"]["x_account_snapshots"]["Row"]
): XAccountSnapshot {
  return {
    id: row.id,
    followerCount: row.follower_count,
    followingCount: row.following_count,
    tweetCount: row.tweet_count,
    listedCount: row.listed_count,
    username: row.username,
    displayName: row.display_name,
    snapshotAt: row.snapshot_at,
    createdAt: row.created_at,
  };
}

export function mapXPost(row: Database["public"]["Tables"]["x_posts"]["Row"]): XPost {
  return {
    id: row.id,
    tweetId: row.tweet_id,
    text: row.text,
    authorUsername: row.author_username,
    likeCount: row.like_count,
    retweetCount: row.retweet_count,
    replyCount: row.reply_count,
    impressionCount: row.impression_count,
    postedAt: row.posted_at,
    isPlantpal: row.is_plantpal,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapXPostQueueItem(
  row: Database["public"]["Tables"]["x_post_queue"]["Row"]
): XPostQueueItem {
  return {
    id: row.id,
    sproutPostId: row.sprout_post_id,
    bloomPieceId: row.bloom_piece_id,
    text: row.text,
    status: row.status as XPostQueueStatus,
    engagementScore: row.engagement_score,
    gateApproved: row.gate_approved,
    sageApproved: row.sage_approved,
    publishedTweetId: row.published_tweet_id,
    errorMessage: row.error_message,
    scheduledAt: row.scheduled_at,
    publishedAt: row.published_at,
    createdByAgent: row.created_by_agent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDailyReport(row: Database["public"]["Tables"]["daily_reports"]["Row"]): DailyReport {
  return {
    id: row.id,
    reportDate: row.report_date,
    summary: row.summary,
    agentProductivity: (row.agent_productivity as unknown as AgentProductivityEntry[]) ?? [],
    workflowSummary: (row.workflow_summary as unknown as WorkflowSummary) ?? { completed: [], active: [], blocked: [], all: [] },
    analyticsSummary: (row.analytics_summary as unknown as AnalyticsSummary) ?? ({} as AnalyticsSummary),
    apiUsageSummary: (row.api_usage_summary as unknown as ApiUsageSummary) ?? ({} as ApiUsageSummary),
    growthRecommendations: (row.growth_recommendations as unknown as GrowthUpgradeRecommendation[]) ?? [],
    recommendedActions: (row.recommended_actions as unknown as RecommendedAction[]) ?? [],
    // Phase 27 structured sections — null for reports saved before migration 046
    executiveSummary: (row.executive_summary as unknown as DailyReport["executiveSummary"]) ?? null,
    contentReport: (row.content_report as unknown as DailyReport["contentReport"]) ?? null,
    growthReport: (row.growth_report as unknown as DailyReport["growthReport"]) ?? null,
    actionPlan: (row.action_plan as unknown as DailyReport["actionPlan"]) ?? null,
    founderReview: (row.founder_review as unknown as DailyReport["founderReview"]) ?? null,
    createdAt: row.created_at,
  };
}

export function mapWorkflowRun(row: Database["public"]["Tables"]["workflow_runs"]["Row"]) {
  return {
    id: row.id,
    workflowName: row.workflow_name,
    sourceAgent: row.source_agent as AgentSlug,
    targetAgent: row.target_agent as AgentSlug,
    status: row.status as "completed" | "active" | "blocked" | "idle",
    itemsMoved: row.items_moved,
    bottleneck: row.bottleneck,
    recommendation: row.recommendation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapGrowthActionItem(row: Database["public"]["Tables"]["growth_action_items"]["Row"]): GrowthActionItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority as CollaborationPriority,
    impactScore: row.impact_score,
    effortScore: row.effort_score,
    ownerAgent: row.owner_agent as AgentSlug,
    status: row.status as GrowthActionItem["status"],
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAgentSchedule(row: Database["public"]["Tables"]["agent_schedules"]["Row"]): AgentSchedule {
  const extended = row as Database["public"]["Tables"]["agent_schedules"]["Row"] & {
    interval_minutes?: number | null;
  };
  return {
    id: row.id,
    agentId: row.agent_id as SchedulableAgent,
    frequencyType: row.frequency_type as AgentSchedule["frequencyType"],
    intervalHours: row.interval_hours,
    intervalMinutes: extended.interval_minutes ?? null,
    dailyAtHour: row.daily_at_hour,
    dailyAtMinute: row.daily_at_minute,
    enabled: row.enabled,
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAgentRun(row: Database["public"]["Tables"]["agent_runs"]["Row"]): AgentRun {
  return {
    id: row.id,
    agentId: row.agent_id as SchedulableAgent,
    scheduleId: row.schedule_id,
    status: row.status as AgentRun["status"],
    triggerSource: row.trigger_source as AgentRun["triggerSource"],
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationMs: row.duration_ms,
    itemsProcessed: row.items_processed,
    errorMessage: row.error_message,
    resultSummary: (row.result_summary as unknown as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  };
}

export function mapAgentHealth(row: Database["public"]["Tables"]["agent_health"]["Row"]): AgentHealth {
  const extended = row as Database["public"]["Tables"]["agent_health"]["Row"] & {
    total_failures?: number;
    total_items_created?: number;
    last_items_created?: number;
  };
  return {
    id: row.id,
    agentId: row.agent_id as SchedulableAgent,
    status: row.status as AgentHealth["status"],
    lastSuccessAt: row.last_success_at,
    lastFailureAt: row.last_failure_at,
    lastErrorMessage: row.last_error_message,
    consecutiveFailures: row.consecutive_failures,
    totalRuns: row.total_runs,
    totalSuccesses: row.total_successes,
    totalFailures: extended.total_failures ?? Math.max(0, row.total_runs - row.total_successes),
    totalItemsCreated: extended.total_items_created ?? 0,
    lastItemsCreated: extended.last_items_created ?? 0,
    avgDurationMs: row.avg_duration_ms,
    updatedAt: row.updated_at,
  };
}
