export type Status = "pending" | "approved" | "rejected" | "draft";

export type Platform =
  | "TikTok"
  | "Instagram"
  | "X"
  | "Threads"
  | "Reddit"
  | "Facebook"
  | "YouTube"
  | "LinkedIn";

export type ContentFormat =
  | "tiktok"
  | "reels"
  | "instagram"
  | "x"
  | "carousel"
  | "blog";

export type CreativeContentType =
  | "plant_er"
  | "plant_confessions"
  | "garden_wins"
  | "beginner_mistakes"
  | "local_gardening"
  | "plantpal_challenges"
  | "family_gardening";

export type CreativeOutputFormat =
  | "tiktok"
  | "reels"
  | "short_form_script"
  | "carousel"
  | "x"
  | "threads"
  | "blog"
  | "push_notification"
  | "email_subject";

export interface CreativeContentIdea {
  id: string;
  title: string;
  contentType: CreativeContentType;
  format: CreativeOutputFormat;
  hook: string;
  emotionalTrigger: string;
  whyItWorks: string;
  cta: string;
  difficultyScore: number;
  viralScore: number;
  body: string;
  status: Status;
  generationBatchId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type ImagePromptCategory =
  | "social_graphic"
  | "app_screenshot"
  | "educational"
  | "before_after";

export type PartnershipType =
  | "nursery"
  | "garden_center"
  | "landscaper"
  | "botanical_garden"
  | "influencer"
  | "seed_company"
  | "home_garden_brand";

export type CompetitorAlertType =
  | "new_feature"
  | "app_store_ranking"
  | "viral_post"
  | "new_ad"
  | "negative_reviews";

export type CompetitorIntelAlertType =
  | "new_feature"
  | "app_store_ranking"
  | "viral_post"
  | "new_ad"
  | "negative_reviews"
  | "partnership_discovered"
  | "social_growth"
  | "review_trend";

export type ReviewTrend = "improving" | "stable" | "declining" | "negative_spike";

export type SentinelAgentState =
  | "monitoring"
  | "analyzing"
  | "alert_detected"
  | "reporting"
  | "idle";

export interface CompetitorScoreboardEntry {
  id: string;
  name: string;
  slug: string;
  estimatedGrowth: number;
  appStoreRank?: number | null;
  appStoreCategory: string;
  reviewTrend: ReviewTrend;
  reviewScore: number;
  socialEngagementScore: number;
  newFeaturesCount: number;
  recentCampaigns: string[];
  threatLevel: number;
  opportunityLevel: number;
  notes: string;
  lastScannedAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CompetitorIntelAlert {
  id: string;
  competitor: string;
  alertType: CompetitorIntelAlertType;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  source: string;
  recommendedAction: string;
  status: "active" | "acknowledged" | "dismissed";
  createdAt: string;
  updatedAt?: string;
}

export interface CompetitorDailyBrief {
  id: string;
  briefDate: string;
  biggestThreat: string;
  biggestOpportunity: string;
  recommendedResponse: string;
  alertsCount: number;
  competitorsScanned: number;
  status: "running" | "completed" | "failed";
  createdAt: string;
}

export type ApprovalItemType =
  | "content"
  | "reply"
  | "image_prompt"
  | "video_script"
  | "social_post";

export interface ContentIdea {
  id: string;
  title: string;
  format: ContentFormat;
  hook: string;
  body: string;
  status: Status;
  createdAt: string;
  updatedAt?: string;
}

export interface SocialPost {
  id: string;
  platform: Platform;
  caption: string;
  hashtags: string[];
  status: Status;
  createdAt: string;
  updatedAt?: string;
}

export interface ImagePrompt {
  id: string;
  title: string;
  category: ImagePromptCategory;
  prompt: string;
  style: string;
  status: Status;
  sourceTable?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface VideoScript {
  id: string;
  title: string;
  platform: Platform;
  hook: string;
  scenes: { label: string; description: string }[];
  onScreenText: string[];
  voiceover: string;
  cta: string;
  status: Status;
  createdAt: string;
  updatedAt?: string;
}

export type OpportunityType =
  | "plant_problems"
  | "garden_design"
  | "plant_identification"
  | "beginner_questions"
  | "local_gardening"
  | "landscaping";

export type Sentiment = "positive" | "neutral" | "negative" | "frustrated" | "curious";

export type CreatorPartnershipStatus =
  | "prospect"
  | "high_priority"
  | "outreach_pending"
  | "contacted"
  | "negotiating"
  | "partnered"
  | "declined";

export type PartnershipIdeaType =
  | "challenge"
  | "product_review"
  | "garden_transformation"
  | "plant_rescue"
  | "community_event"
  | "giveaway";

export interface CreatorLead {
  id: string;
  name: string;
  handle: string;
  platform: Platform | string;
  category: string;
  followers: number;
  engagementRate: number;
  averageViews: number;
  location: string;
  email: string;
  website: string;
  partnershipScore: number;
  audienceFit: number;
  engagementScore: number;
  postingFrequency: number;
  contentQuality: number;
  growthTrend: number;
  partnershipStatus: CreatorPartnershipStatus;
  priority: "normal" | "high";
  source: string;
  suggestedIdeas: string[];
  notes: string;
  status: Status;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatorPartnership {
  id: string;
  creatorLeadId?: string | null;
  title: string;
  ideaType: PartnershipIdeaType;
  description: string;
  status: "recommended" | "approved" | "rejected" | "active" | "completed";
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityMention {
  id: string;
  platform: Platform | string;
  author: string;
  content: string;
  url: string;
  sentiment: Sentiment;
  processed: boolean;
  createdAt: string;
}

/** Phase 34 — full source attribution carried by opportunities and replies. */
export interface SourceInfo {
  sourceUrl: string;
  sourceAuthor: string;
  sourceAuthorUrl: string;
  sourcePlatform: string;
  sourceTitle: string;
  sourceSubreddit: string;
  sourceCreatedAt: string | null;
  engagement: Record<string, number>;
  dataSource: string;
}

export interface CommunityOpportunity extends SourceInfo {
  id: string;
  platform: Platform;
  author: string;
  post: string;
  topic: string;
  question: string;
  sentiment: Sentiment;
  urgencyScore: number;
  opportunityScore: number;
  opportunityType: OpportunityType;
  suggestedReply: string;
  mentionId?: string | null;
  status: Status;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityReplyDraft extends SourceInfo {
  id: string;
  opportunityId?: string | null;
  platform: Platform | string;
  author: string;
  originalContent: string;
  draft: string;
  status: Status;
  createdAt: string;
  updatedAt?: string;
}

export type BloomContentFormat =
  | "x_post"
  | "threads_post"
  | "tiktok_concept"
  | "reels_concept"
  | "shorts_concept"
  | "carousel"
  | "blog_idea"
  | "email_idea";

export type BloomSourceType =
  | "scout_discovery"
  | "roots_conversation"
  | "sentinel_alert"
  | "seasonal_event";

export type BloomPieceStatus =
  | "awaiting_review"
  | "pending"
  | "approved"
  | "rejected"
  | "draft"
  | "published";

export type SageRecommendation = "approve" | "reject";

export interface SageReviewBatch {
  id: string;
  runDate: string;
  status: "running" | "completed" | "failed";
  piecesReviewed: number;
  approvedCount: number;
  rejectedCount: number;
  avgAggregateScore: number;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface SageContentReview {
  id: string;
  batchId?: string | null;
  bloomPieceId: string;
  originalityScore: number;
  humorScore: number;
  emotionalImpactScore: number;
  shareabilityScore: number;
  storytellingScore: number;
  educationalScore: number;
  aggregateScore: number;
  recommendation: SageRecommendation;
  rejectionReason: string;
  hookSuggestion: string;
  ctaSuggestion: string;
  storytellingSuggestion: string;
  creativeOpportunity: string;
  status: "completed" | "failed";
  createdAt: string;
  updatedAt?: string;
  piece?: BloomContentPiece;
}

export type SageAgentState =
  | "reviewing"
  | "scoring"
  | "rejecting"
  | "approving"
  | "reporting"
  | "idle";

export type SproutPlatform =
  | "Instagram"
  | "TikTok"
  | "X"
  | "Threads"
  | "Pinterest"
  | "YouTube";

export type SproutPostStatus = "waiting" | "scheduling" | "ready" | "published";

export type SproutAgentState = "waiting" | "scheduling" | "ready" | "published" | "idle";

export type OakPartnerType =
  | "influencer"
  | "nursery"
  | "garden_center"
  | "landscaper"
  | "botanical_garden"
  | "brand"
  | "seed_company"
  | "home_garden_brand";

export type OakPipelineStage =
  | "contacted"
  | "replied"
  | "negotiating"
  | "active"
  | "completed";

export type OakAgentState =
  | "prospecting"
  | "outreach"
  | "negotiating"
  | "managing"
  | "reporting"
  | "idle";

export type IvyBriefType = "daily" | "weekly";

export type IvyRecommendationCategory =
  | "roi_action"
  | "threat"
  | "approval"
  | "growth_opportunity";

export type IvyAlertType = "urgent" | "risk" | "growth";

export type IvyAgentState = "reviewing" | "prioritizing" | "reporting" | "monitoring" | "idle";

export interface IvyBriefSections {
  executiveSummary: string;
  topOpportunities: string[];
  highestPriorityApproval: string;
  bestCreatorFound: string;
  bestPartnershipOpportunity: string;
  biggestCompetitorThreat: string;
  bestContentCreated: string;
  communityTrends: string[];
  recommendedActions: string[];
}

export interface IvyBrief {
  id: string;
  briefType: IvyBriefType;
  runDate: string;
  executiveSummary: string;
  sections: IvyBriefSections;
  createdAt: string;
  updatedAt?: string;
}

export interface IvyRecommendation {
  id: string;
  category: IvyRecommendationCategory;
  title: string;
  description: string;
  priorityScore: number;
  revenueImpact: number;
  growthImpact: number;
  viralityPotential: number;
  timeSensitivity: number;
  sourceAgent: string;
  sourceEntityId?: string | null;
  status: "pending" | "acknowledged" | "dismissed";
  briefDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IvyRecommendationDraft {
  category: IvyRecommendationCategory;
  title: string;
  description: string;
  priorityScore: number;
  revenueImpact: number;
  growthImpact: number;
  viralityPotential: number;
  timeSensitivity: number;
  sourceAgent: string;
  sourceEntityId?: string | null;
}

export interface IvyAlert {
  id: string;
  alertType: IvyAlertType;
  title: string;
  description: string;
  priorityScore: number;
  sourceAgent: string;
  sourceEntityId?: string | null;
  status: "active" | "acknowledged" | "resolved";
  briefDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IvyAlertDraft {
  alertType: IvyAlertType;
  title: string;
  description: string;
  priorityScore: number;
  sourceAgent: string;
  sourceEntityId?: string | null;
}

export type AtlasGrowthStage = "0_to_1k" | "1k_to_10k" | "10k_to_100k" | "100k_to_1m";

export type AtlasAgentState = "analyzing" | "forecasting" | "testing" | "recommending" | "monitoring" | "idle";

export type AtlasExperimentStatus = "proposed" | "running" | "completed" | "paused" | "cancelled";

export type AtlasExperimentEffort = "low" | "medium" | "high";

export type AtlasForecastHorizon = "7d" | "30d" | "90d" | "annual";

export type AtlasBottleneckType =
  | "conversion"
  | "engagement"
  | "retention"
  | "creator_performance"
  | "channel_underperformance"
  | "waitlist"
  | "traffic";

export type AtlasRecommendationCategory =
  | "acquisition"
  | "retention"
  | "channel"
  | "experiment"
  | "bottleneck_fix";

export type AtlasReportType = "daily" | "weekly";

export interface AtlasGrowthMetrics {
  id: string;
  snapshotDate: string;
  totalUsers: number;
  totalInstalls: number;
  waitlistCount: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  trafficSessions: number;
  conversionRate: number;
  engagementRate: number;
  retentionD7: number;
  retentionD30: number;
  growthStage: AtlasGrowthStage;
  channelBreakdown: Record<string, number>;
  createdAt: string;
  updatedAt?: string;
}

export interface AtlasExperiment {
  id: string;
  name: string;
  hypothesis: string;
  expectedOutcome: string;
  effort: AtlasExperimentEffort;
  impact: number;
  priorityScore: number;
  status: AtlasExperimentStatus;
  results: string;
  reportDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AtlasExperimentDraft {
  name: string;
  hypothesis: string;
  expectedOutcome: string;
  effort: AtlasExperimentEffort;
  impact: number;
  priorityScore: number;
  status: AtlasExperimentStatus;
  results: string;
}

export interface AtlasRecommendation {
  id: string;
  title: string;
  description: string;
  category: AtlasRecommendationCategory;
  reach: number;
  cost: number;
  difficulty: number;
  virality: number;
  revenuePotential: number;
  retentionPotential: number;
  priorityScore: number;
  sourceAgent: string;
  reportDate: string;
  status: "pending" | "acknowledged" | "dismissed";
  createdAt: string;
  updatedAt?: string;
}

export interface AtlasRecommendationDraft {
  title: string;
  description: string;
  category: AtlasRecommendationCategory;
  reach: number;
  cost: number;
  difficulty: number;
  virality: number;
  revenuePotential: number;
  retentionPotential: number;
  priorityScore: number;
  sourceAgent: string;
}

export interface AtlasForecast {
  id: string;
  horizon: AtlasForecastHorizon;
  predictedUsers: number;
  predictedInstalls: number;
  growthRatePct: number;
  confidence: number;
  assumptions: string;
  reportDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AtlasForecastDraft {
  horizon: AtlasForecastHorizon;
  predictedUsers: number;
  predictedInstalls: number;
  growthRatePct: number;
  confidence: number;
  assumptions: string;
}

export interface AtlasGrowthReportSections {
  biggestOpportunity: string;
  biggestRisk: string;
  fastestWin: string;
  bestPerformingChannel: string;
  worstPerformingChannel: string;
  recommendedAction: string;
  totalUsers?: number;
  growthStage?: AtlasGrowthStage;
  whatWorked?: string[];
  whatFailed?: string[];
  doubleDown?: string[];
  stopDoing?: string[];
}

export interface AtlasGrowthReport {
  id: string;
  reportType: AtlasReportType;
  runDate: string;
  executiveSummary: string;
  sections: AtlasGrowthReportSections;
  createdAt: string;
  updatedAt?: string;
}

export interface AtlasBottleneck {
  id: string;
  bottleneckType: AtlasBottleneckType;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  suggestedFix: string;
  metricValue?: number | null;
  benchmarkValue?: number | null;
  status: "active" | "resolved" | "monitoring";
  reportDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AtlasBottleneckDraft {
  bottleneckType: AtlasBottleneckType;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  suggestedFix: string;
  metricValue?: number;
  benchmarkValue?: number;
}

export type FernTrafficSource =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "reddit"
  | "facebook_groups"
  | "google_search"
  | "influencers"
  | "partnerships"
  | "referral"
  | "other";

export type FernOpportunityType =
  | "acquisition"
  | "viral_loop"
  | "referral"
  | "community"
  | "partnership"
  | "traffic";

export type FernAgentState = "analyzing" | "forecasting" | "testing" | "reporting" | "monitoring" | "idle";

export type FernForecastHorizon = "7d" | "30d" | "90d" | "monthly";

export interface FernOpportunity {
  id: string;
  title: string;
  description: string;
  trafficSource: FernTrafficSource;
  opportunityType: FernOpportunityType;
  reach: number;
  cost: number;
  difficulty: number;
  virality: number;
  estimatedInstalls: number;
  priorityScore: number;
  sourceAgent: string;
  reportDate: string;
  status: "pending" | "acknowledged" | "dismissed";
  createdAt: string;
  updatedAt?: string;
}

export interface FernOpportunityDraft {
  title: string;
  description: string;
  trafficSource: FernTrafficSource;
  opportunityType: FernOpportunityType;
  reach: number;
  cost: number;
  difficulty: number;
  virality: number;
  estimatedInstalls: number;
  priorityScore: number;
  sourceAgent: string;
}

export interface FernExperiment {
  id: string;
  name: string;
  hypothesis: string;
  effort: "low" | "medium" | "high";
  expectedImpact: number;
  status: "proposed" | "running" | "completed" | "paused" | "cancelled";
  results: string;
  reportDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FernExperimentDraft {
  name: string;
  hypothesis: string;
  effort: "low" | "medium" | "high";
  expectedImpact: number;
  status: "proposed" | "running" | "completed" | "paused" | "cancelled";
  results: string;
}

export interface FernForecast {
  id: string;
  horizon: FernForecastHorizon;
  trafficSource: string;
  predictedInstalls: number;
  confidence: number;
  assumptions: string;
  reportDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FernForecastDraft {
  horizon: FernForecastHorizon;
  trafficSource: string;
  predictedInstalls: number;
  confidence: number;
  assumptions: string;
}

export type EchoFeedbackSource =
  | "support_ticket"
  | "app_review"
  | "email"
  | "community_comment"
  | "reddit"
  | "facebook_groups"
  | "youtube_comment"
  | "tiktok_comment"
  | "instagram_comment"
  | "survey"
  | "feature_request";

export type EchoCategory =
  | "plant_identification"
  | "plant_doctor"
  | "academy"
  | "tasks"
  | "reminders"
  | "landscape_designer"
  | "community"
  | "pricing"
  | "subscriptions"
  | "onboarding"
  | "performance"
  | "general_feedback";

export type EchoFeedbackType =
  | "feature_request"
  | "complaint"
  | "confusion"
  | "friction"
  | "satisfaction"
  | "onboarding_issue"
  | "retention_issue"
  | "bug_report"
  | "praise"
  | "general";

export type EchoSentiment = "positive" | "neutral" | "negative" | "urgent";

export type EchoChurnReason =
  | "confusion"
  | "missing_features"
  | "pricing"
  | "bugs"
  | "poor_experience"
  | "other";

export type EchoAgentState = "listening" | "analyzing" | "summarizing" | "reporting" | "monitoring" | "idle";

export type EchoReportType = "daily" | "weekly";

export type EchoFeatureTrend = "rising" | "stable" | "declining" | "emerging";

export interface EchoFeedback {
  id: string;
  source: EchoFeedbackSource;
  category: EchoCategory;
  feedbackType: EchoFeedbackType;
  sentiment: EchoSentiment;
  content: string;
  author: string;
  rating?: number | null;
  reportDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EchoFeedbackDraft {
  source: EchoFeedbackSource;
  category: EchoCategory;
  feedbackType: EchoFeedbackType;
  sentiment: EchoSentiment;
  content: string;
  author: string;
  rating: number | null;
}

export interface EchoFeatureRequest {
  id: string;
  featureName: string;
  category: string;
  description: string;
  frequency: number;
  priority: number;
  impact: number;
  estimatedDemand: number;
  trend: EchoFeatureTrend;
  status: "tracking" | "recommended" | "planned" | "shipped";
  reportDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EchoFeatureRequestDraft {
  featureName: string;
  category: string;
  description: string;
  frequency: number;
  priority: number;
  impact: number;
  estimatedDemand: number;
  trend: EchoFeatureTrend;
}

export interface EchoSentimentRecord {
  id: string;
  snapshotDate: string;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  urgentCount: number;
  positivePct: number;
  negativePct: number;
  trendDirection: "improving" | "stable" | "declining";
  topCategory: string;
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EchoSentimentSnapshot {
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  urgentCount: number;
  positivePct: number;
  negativePct: number;
  trendDirection: "improving" | "stable" | "declining";
  topCategory: EchoCategory;
  notes: string;
}

export interface EchoLoveSignal {
  id: string;
  feature: string;
  quote: string;
  source: string;
  category: string;
  marketingPotential: number;
  testimonialReady: boolean;
  ambassadorPotential: boolean;
  reportDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EchoLoveSignalDraft {
  feature: string;
  quote: string;
  source: string;
  category: string;
  marketingPotential: number;
  testimonialReady: boolean;
  ambassadorPotential: boolean;
}

export interface EchoChurnRisk {
  id: string;
  title: string;
  description: string;
  churnReason: EchoChurnReason;
  severity: "low" | "medium" | "high";
  affectedUsersEstimate: number;
  suggestedAction: string;
  status: "active" | "monitoring" | "resolved";
  reportDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EchoChurnRiskDraft {
  title: string;
  description: string;
  churnReason: EchoChurnReason;
  severity: "low" | "medium" | "high";
  affectedUsersEstimate: number;
  suggestedAction: string;
}

export interface EchoReportSections {
  topComplaints: string[];
  topFeatureRequests: string[];
  topPositiveFeedback: string[];
  urgentIssues: string[];
  recommendedActions: string[];
  whatUsersLove?: string[];
  whatUsersHate?: string[];
  whatUsersWantNext?: string[];
  biggestRetentionRisks?: string[];
  productRecommendations?: string[];
}

export interface EchoReport {
  id: string;
  reportType: EchoReportType;
  runDate: string;
  executiveSummary: string;
  sections: EchoReportSections;
  createdAt: string;
  updatedAt?: string;
}

export interface OakPartnershipDeal {
  id: string;
  creatorLeadId?: string | null;
  partnerName: string;
  partnerType: OakPartnerType;
  contactName: string;
  contactEmail: string;
  location: string;
  stage: OakPipelineStage;
  outreachDraft: string;
  collaborationIdea: string;
  followUpAt?: string | null;
  followUpNote: string;
  revenueGenerated: number;
  installsGenerated: number;
  priority: "normal" | "high";
  notes: string;
  outreachApproved: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SproutScheduledPost {
  id: string;
  bloomPieceId?: string | null;
  approvalQueueId?: string | null;
  platform: SproutPlatform;
  title: string;
  hook: string;
  caption: string;
  cta: string;
  scheduledAt?: string | null;
  recommendedTimeLabel: string;
  bestTimeScore: number;
  timezone: string;
  status: SproutPostStatus;
  scheduleApproved: boolean;
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

export type BloomAgentState =
  | "sourcing"
  | "drafting"
  | "queueing"
  | "reporting"
  | "idle";

export interface BloomProductionRun {
  id: string;
  runDate: string;
  status: "running" | "completed" | "failed";
  piecesGenerated: number;
  piecesQueued: number;
  scoutInputs: number;
  rootsInputs: number;
  sentinelInputs: number;
  seasonalInputs: number;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface BloomContentPiece {
  id: string;
  runId?: string | null;
  format: BloomContentFormat;
  platform: string;
  title: string;
  hook: string;
  caption: string;
  cta: string;
  viralScore: number;
  emotionalTrigger: string;
  difficultyScore: number;
  sourceType: BloomSourceType;
  sourceDetail: string;
  scheduledDate?: string | null;
  status: BloomPieceStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface BloomContentPerformance {
  id: string;
  contentPieceId: string;
  platform: string;
  impressions: number;
  engagements: number;
  clicks: number;
  shares: number;
  saves: number;
  notes: string;
  trackedAt: string;
  createdAt: string;
  piece?: BloomContentPiece;
}

export type AgentSlug =
  | "scout" | "roots" | "sentinel" | "bloom" | "sage" | "sprout"
  | "oak" | "ivy" | "atlas" | "fern" | "echo" | "gate" | "moss";

export type AgentMessageType = "handoff" | "request" | "response" | "notification" | "status" | "broadcast";
export type AgentMessageStatus = "unread" | "read" | "acknowledged" | "archived";
export type AgentTaskStatus = "pending" | "in_progress" | "completed" | "blocked" | "cancelled";
export type AgentTaskType =
  | "content_brief" | "partnership_review" | "community_response" | "competitor_analysis"
  | "growth_recommendation" | "voc_insight" | "publish_schedule" | "creative_review"
  | "creator_outreach" | "executive_brief" | "acquisition_test" | "approval_gate";
export type AgentEventType =
  | "scout_found_creator" | "roots_found_discussion" | "sentinel_detected_feature"
  | "bloom_generated_content" | "sage_rejected_content" | "sage_approved_content"
  | "gate_approved_content" | "gate_rejected_content" | "oak_created_partnership"
  | "ivy_executive_brief" | "atlas_growth_insight" | "fern_acquisition_opportunity"
  | "echo_voc_insight" | "agent_message_sent" | "agent_task_assigned" | "agent_task_completed";
export type CollaborationPriority = "low" | "medium" | "high" | "urgent";

export interface AgentMessage {
  id: string;
  fromAgent: AgentSlug;
  toAgent: AgentSlug;
  messageType: AgentMessageType;
  priority: CollaborationPriority;
  title: string;
  body: string;
  status: AgentMessageStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface AgentTask {
  id: string;
  assignedAgent: AgentSlug;
  createdBy: AgentSlug;
  taskType: AgentTaskType;
  description: string;
  priority: CollaborationPriority;
  status: AgentTaskStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt?: string;
  completedAt: string | null;
}

export interface AgentEvent {
  id: string;
  eventType: AgentEventType;
  sourceAgent: AgentSlug;
  targetAgent: AgentSlug | null;
  title: string;
  summary: string;
  impact: string;
  relatedMessageId: string | null;
  relatedTaskId: string | null;
  createdAt: string;
}

export type AgentMemoryType = "fact" | "pattern" | "history" | "insight" | "preference";
export type AgentDecisionType = "recommendation" | "analysis" | "handoff" | "alert" | "approval_request" | "memory_update";
export type AgentDecisionStatus = "pending" | "accepted" | "rejected" | "executed";
export type ConversationRole = "system" | "user" | "assistant";

export interface AgentProfile {
  id: string;
  agentId: AgentSlug;
  role: string;
  goal: string;
  responsibilities: string[];
  systemPrompt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AgentMemory {
  id: string;
  agentId: AgentSlug;
  memoryKey: string;
  memoryValue: string;
  memoryType: AgentMemoryType;
  importance: number;
  sourceRunId: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AgentConversation {
  id: string;
  agentId: AgentSlug;
  runId: string;
  role: ConversationRole;
  content: string;
  model: string;
  tokensUsed: number | null;
  createdAt: string;
}

export interface AgentDecision {
  id: string;
  agentId: AgentSlug;
  runId: string;
  conversationId: string | null;
  decisionType: AgentDecisionType;
  title: string;
  inputSummary: string;
  outputJson: Record<string, unknown>;
  reasoning: string;
  confidence: number;
  status: AgentDecisionStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface AgentActivityLog {
  id: string;
  agentId: AgentSlug;
  action: string;
  detail: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ReplyDraft extends SourceInfo {
  id: string;
  platform: Platform;
  originalPost: string;
  draft: string;
  status: Status;
  createdAt: string;
  updatedAt?: string;
}

export interface Creator {
  id: string;
  name: string;
  platform: Platform;
  niche: string;
  followers: number;
  engagementRate: number;
  email: string;
  status: "prospect" | "contacted" | "negotiating" | "partnered" | "declined";
  notes: string;
  partnershipIdea: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Partnership {
  id: string;
  name: string;
  type: PartnershipType;
  contact: string;
  location: string;
  status: "lead" | "in_discussion" | "active" | "paused";
  notes: string;
  opportunity: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompetitorAlert {
  id: string;
  competitor: string;
  type: CompetitorAlertType;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
  updatedAt?: string;
}

export type DataSource = "demo" | "seed" | "live_api" | "manual" | "imported";

export interface ApprovalItem {
  id: string;
  type: ApprovalItemType;
  channel: Platform | string;
  draft: string;
  status: Status;
  sourceId?: string | null;
  createdAt: string;
  updatedAt?: string;
  // Phase 33 — source context + real vs demo labeling
  sourcePlatform?: string;
  sourceUrl?: string;
  sourceAuthor?: string;
  sourceAuthorUrl?: string;
  sourceTitle?: string;
  sourceExcerpt?: string;
  dataSource?: DataSource | string;
}

export type BriefStatus = "generated" | "running" | "completed" | "failed" | "archived";

export type DiscoveryItemType = "trending_topic" | "question" | "content_opportunity";

export type PipelineStatus = "pending_review" | "approved" | "rejected" | "needs_rewrite";

export interface AgentDailyBrief {
  id: string;
  briefDate: string;
  title: string;
  summary: string;
  agentProductivity: Record<string, unknown>[];
  workflowSummary: Record<string, unknown>;
  apiUsageSummary: Record<string, unknown>;
  analyticsSummary: Record<string, unknown>;
  recommendations: Record<string, unknown>[];
  createdByAgent: string;
  runDate: string;
  status: BriefStatus;
  discoverySummary: string;
  contentCount: number;
  approvedCount: number;
  rejectedCount: number;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt?: string;
}

// ============ Content Calendar (Phase 25) ============

export type CalendarPlatform =
  | "x"
  | "tiktok"
  | "instagram"
  | "youtube_shorts"
  | "reddit"
  | "blog"
  | "email"
  | "pinterest";

export type CalendarStatus =
  | "draft"
  | "sage_review"
  | "gate_review"
  | "approved"
  | "scheduled"
  | "ready_to_publish"
  | "published"
  | "rejected"
  | "needs_asset";

export type CalendarApprovalStatus = "pending" | "sage_approved" | "approved" | "rejected";

export interface ContentCalendarItem {
  id: string;
  title: string;
  platform: CalendarPlatform;
  channel: string;
  contentType: string;
  caption: string;
  hook: string;
  cta: string;
  assetUrl: string;
  assetType: string;
  assetPrompt: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  status: CalendarStatus;
  approvalStatus: CalendarApprovalStatus;
  sourceAgent: string;
  sourceTable: string;
  sourceId: string | null;
  copyText: string;
  platformUrl: string;
  notes: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ContentAsset {
  id: string;
  calendarItemId: string;
  assetType: string;
  assetUrl: string;
  assetPrompt: string;
  thumbnailUrl: string;
  status: "needed" | "generating" | "ready" | "attached" | "rejected";
  createdByAgent: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ContentPublishLog {
  id: string;
  calendarItemId: string;
  platform: string;
  status: "logged" | "queued" | "published" | "manual_published" | "failed" | "status_change";
  publishedUrl: string;
  errorMessage: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CalendarDayStats {
  scheduledToday: number;
  readyToPublish: number;
  missingAssets: number;
  postedToday: number;
  approved: number;
  overdue: number;
}

// ============ Automation (Phase 26) ============

export type AutomationRiskLevel = "low" | "medium" | "high";

export type AutomationAction = "auto_approve" | "batch_approval" | "human_approval";

export interface AutomationRule {
  id: string;
  ruleKey: string;
  label: string;
  description: string;
  agentId: string;
  category: string;
  riskLevel: AutomationRiskLevel;
  action: AutomationAction;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRun {
  id: string;
  ruleKey: string;
  agentId: string;
  action: string;
  status: "running" | "completed" | "failed" | "skipped";
  itemsProcessed: number;
  itemsCreated: number;
  detail: string;
  errorMessage: string;
  metadata: Record<string, unknown>;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface PublishingPackage {
  id: string;
  calendarItemId: string;
  platform: CalendarPlatform;
  caption: string;
  script: string;
  hashtags: string[];
  assetPrompt: string;
  assetUrl: string;
  thumbnailUrl: string;
  uploadChecklist: string[];
  recommendedPostTime: string;
  recommendedPostAt: string | null;
  platformNotes: string;
  copyText: string;
  status: "ready" | "needs_asset" | "published" | "archived";
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type BatchApprovalItemType =
  | "x_post"
  | "tiktok_package"
  | "instagram_package"
  | "youtube_package"
  | "reddit_reply"
  | "blog_draft"
  | "creator_outreach"
  | "other";

export type BatchApprovalStatus = "pending" | "approved" | "rejected" | "edited" | "sent_back";

export interface BatchApprovalItem {
  id: string;
  batchDate: string;
  itemType: BatchApprovalItemType;
  riskLevel: AutomationRiskLevel;
  platform: string;
  title: string;
  content: string;
  sourceTable: string;
  sourceId: string | null;
  calendarItemId: string | null;
  status: BatchApprovalStatus;
  decidedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveryItemRecord {
  id: string;
  briefId: string;
  itemType: DiscoveryItemType;
  title: string;
  description: string;
  source: string;
  relevanceScore: number;
  createdAt: string;
}

export interface PipelineContent {
  id: string;
  briefId: string;
  platform: string;
  format: string;
  hook: string;
  caption: string;
  cta: string;
  viralScore: number;
  originalityScore: number;
  humorScore: number;
  emotionalImpactScore: number;
  shareabilityScore: number;
  educationalScore: number;
  aggregateScore: number;
  directorNotes: string;
  rewriteCount: number;
  status: PipelineStatus;
  createdAt: string;
  updatedAt?: string;
}

export type IntegrationProvider =
  | "openai"
  | "openweather"
  | "plantnet"
  | "perenual"
  | "serpapi"
  | "x"
  | "f5bot";

export type IntegrationStatus = "connected" | "disconnected" | "degraded" | "error";

export type IntegrationLogStatus = "success" | "error" | "rate_limited";

export type XPostQueueStatus =
  | "draft"
  | "sage_review"
  | "gate_approval"
  | "queued"
  | "ready_to_publish"
  | "published"
  | "failed"
  | "rejected";

export interface IntegrationStatusRow {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  configured: boolean;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string;
  lastHealthCheckAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

/** @deprecated Use IntegrationStatusRow */
export type IntegrationProviderStatus = IntegrationStatusRow;

export interface IntegrationLog {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationLogStatus;
  message: string;
  error: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiRateLimitRow {
  id: string;
  provider: IntegrationProvider;
  windowStart: string;
  requestCount: number;
  maxPerMinute: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ProviderHealthCheckRow {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  message: string;
  durationMs: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface XAccountSnapshot {
  id: string;
  followerCount: number;
  followingCount: number;
  tweetCount: number;
  listedCount: number;
  username: string;
  displayName: string;
  snapshotAt: string;
  createdAt: string;
}

export interface XPost {
  id: string;
  tweetId: string;
  text: string;
  authorUsername: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  impressionCount: number;
  postedAt: string | null;
  isPlantpal: boolean;
  source: string;
  createdAt: string;
  updatedAt?: string;
}

export interface XPostQueueItem {
  id: string;
  sproutPostId: string | null;
  bloomPieceId: string | null;
  text: string;
  status: XPostQueueStatus;
  engagementScore: number;
  gateApproved: boolean;
  sageApproved: boolean;
  publishedTweetId: string | null;
  errorMessage: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdByAgent: string;
  createdAt: string;
  updatedAt?: string;
}

export type MarketingTable =
  | "content_ideas"
  | "creative_content_ideas"
  | "social_posts"
  | "image_prompts"
  | "video_scripts"
  | "community_opportunities"
  | "community_reply_drafts"
  | "reply_drafts"
  | "creators"
  | "creator_leads"
  | "creator_partnerships"
  | "partnerships"
  | "competitor_alerts"
  | "competitor_intel_alerts"
  | "competitor_scoreboard"
  | "bloom_content_pieces"
  | "bloom_production_runs"
  | "sage_content_reviews"
  | "sage_review_batches"
  | "sprout_scheduled_posts"
  | "oak_partnership_pipeline"
  | "approval_queue"
  | "pipeline_content";

export interface DashboardStats {
  contentIdeas: number;
  postsDrafted: number;
  creatorsFound: number;
  partnershipLeads: number;
  competitorAlerts: number;
  communityOpportunities: number;
  approvedPosts: number;
  pendingApprovals: number;
}
