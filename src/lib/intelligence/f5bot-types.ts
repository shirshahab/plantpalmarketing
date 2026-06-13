/** Phase 41 — F5Bot alert shapes and classification types. */

export interface F5BotRawAlert {
  id?: string | number;
  url?: string;
  title?: string;
  content_html?: string;
  content?: string;
  body?: string;
  date_published?: string;
  published?: string;
  group?: string;
  username?: string;
  author?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface F5BotJsonFeed {
  items?: F5BotRawAlert[];
  next_url?: string;
  prev_url?: string;
  [key: string]: unknown;
}

export interface NormalizedF5BotAlert {
  externalId: string;
  source: string;
  sourceUrl: string;
  title: string;
  body: string;
  author: string;
  matchedKeyword: string;
  keywordGroup: string;
  publishedAt: string | null;
  rawPayload: Record<string, unknown>;
}

export type IntelligenceClassification =
  | "community_opportunity"
  | "content_idea"
  | "seo_topic"
  | "competitor_alert"
  | "creator_opportunity"
  | "product_feedback"
  | "ignore";

export type F5BotOpportunityType = IntelligenceClassification;

export interface IntelligenceAlertRow {
  id: string;
  source: string;
  title: string;
  body: string;
  url: string;
  author: string;
  subreddit: string;
  createdAt: string;
  classification: IntelligenceClassification;
  priority: "low" | "medium" | "high";
  assignedAgent: string;
  status: string;
  externalId: string;
  receivedAt: string;
}

/** @deprecated Use IntelligenceAlertRow — kept for legacy opportunity joins */
export interface F5BotAlertRow {
  id: string;
  externalId: string;
  source: string;
  sourceUrl: string;
  title: string;
  body: string;
  author: string;
  matchedKeyword: string;
  keywordGroup: string;
  publishedAt: string | null;
  receivedAt: string;
  status: string;
  dataSource: string;
  createdAt: string;
  classification?: IntelligenceClassification;
  priority?: string;
  assignedAgent?: string;
  subreddit?: string;
}

export interface IntelligenceOpportunityRow {
  id: string;
  sourceType: string;
  sourceTable: string;
  sourceId: string;
  platform: string;
  title: string;
  summary: string;
  opportunityType: string;
  priority: string;
  recommendedAgent: string;
  suggestedAction: string;
  sourceUrl: string;
  status: string;
  workflowId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface F5BotClassification {
  classification: IntelligenceClassification;
  priority: "low" | "medium" | "high";
  assignedAgent: string;
  suggestedAction: string;
  founderInbox: boolean;
}

export interface IntelligenceDashboardStats {
  newAlerts: number;
  communityOpportunities: number;
  contentIdeas: number;
  competitorAlerts: number;
  seoOpportunities: number;
}

export interface F5BotFetchResult {
  fetched: number;
  inserted: number;
  duplicates: number;
  processed: number;
  failed: number;
  errors: string[];
}

/** @deprecated alias */
export type F5BotPollResult = F5BotFetchResult;

export interface F5BotDiagnostics {
  apiTokenPresent: boolean;
  jsonFeedPresent: boolean;
  rssFeedPresent: boolean;
  webhookSecretPresent: boolean;
  webhookUrl: string;
  lastPoll: string | null;
  lastWebhookReceived: string | null;
  lastAlertReceived: string | null;
  lastProcessError: string | null;
  alertCount: number;
  opportunityCount: number;
}
