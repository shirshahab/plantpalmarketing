"use client";

import {
  AlertTriangle,
  AtSign,
  CheckSquare,
  FileText,
  Megaphone,
  MessageCircle,
  Radio,
  Sparkles,
  Users,
  Zap,
  Star,
  Calendar,
  Send,
  Rocket,
  Handshake,
  Mail,
  Bell,
  Crown,
  Target,
  Telescope,
  FlaskConical,
  TrendingUp,
  Download,
  Sprout,
  MessageCircleHeart,
  Heart,
  GitBranch,
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApprovalFeedItem } from "@/components/hq/approval-feed-item";
import { ACTIVITY_LABELS } from "@/lib/hq/mock-data";
import type { ActivityItem } from "@/lib/hq/types";

const typeConfig: Record<
  ActivityItem["type"],
  { icon: typeof Radio; color: string; bg: string }
> = {
  key_update: { icon: Radio, color: "text-sky-600", bg: "bg-sky-50" },
  content_draft: { icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
  suggested_post: { icon: Sparkles, color: "text-violet-600", bg: "bg-violet-50" },
  comment_found: { icon: AtSign, color: "text-amber-600", bg: "bg-amber-50" },
  community_opportunity: { icon: MessageCircle, color: "text-teal-600", bg: "bg-teal-50" },
  creator_lead: { icon: Users, color: "text-orange-600", bg: "bg-orange-50" },
  competitor_alert: { icon: AlertTriangle, color: "text-slate-700", bg: "bg-slate-100" },
  approval_needed: { icon: CheckSquare, color: "text-rose-600", bg: "bg-rose-50" },
  scout_found_creator: { icon: Users, color: "text-amber-700", bg: "bg-amber-50" },
  roots_found_discussion: { icon: MessageCircle, color: "text-teal-700", bg: "bg-teal-50" },
  suggested_partnership: { icon: Sparkles, color: "text-violet-700", bg: "bg-violet-50" },
  reply_awaiting_approval: { icon: CheckSquare, color: "text-rose-700", bg: "bg-rose-50" },
  competitor_feature: { icon: Zap, color: "text-blue-700", bg: "bg-blue-50" },
  competitor_viral: { icon: Megaphone, color: "text-purple-700", bg: "bg-purple-50" },
  competitor_brief: { icon: Radio, color: "text-slate-600", bg: "bg-slate-50" },
  bloom_batch: { icon: Sparkles, color: "text-pink-700", bg: "bg-pink-50" },
  bloom_content_draft: { icon: FileText, color: "text-emerald-700", bg: "bg-emerald-50" },
  sage_review_batch: { icon: Star, color: "text-teal-700", bg: "bg-teal-50" },
  sage_rejection: { icon: AlertTriangle, color: "text-rose-700", bg: "bg-rose-50" },
  sage_approval: { icon: CheckSquare, color: "text-teal-700", bg: "bg-teal-50" },
  sprout_scheduled: { icon: Calendar, color: "text-lime-700", bg: "bg-lime-50" },
  sprout_ready: { icon: Send, color: "text-lime-800", bg: "bg-lime-50" },
  sprout_published: { icon: Rocket, color: "text-emerald-700", bg: "bg-emerald-50" },
  oak_partnership: { icon: Handshake, color: "text-amber-800", bg: "bg-amber-50" },
  oak_outreach: { icon: Mail, color: "text-amber-700", bg: "bg-amber-50" },
  oak_follow_up: { icon: Bell, color: "text-orange-700", bg: "bg-orange-50" },
  ivy_recommendation: { icon: Target, color: "text-violet-800", bg: "bg-violet-50" },
  ivy_alert: { icon: AlertTriangle, color: "text-rose-700", bg: "bg-rose-50" },
  ivy_brief: { icon: Crown, color: "text-violet-700", bg: "bg-violet-50" },
  ivy_daily_report: { icon: Crown, color: "text-violet-800", bg: "bg-violet-100" },
  atlas_recommendation: { icon: TrendingUp, color: "text-sky-800", bg: "bg-sky-50" },
  atlas_forecast: { icon: Telescope, color: "text-sky-700", bg: "bg-sky-50" },
  atlas_experiment: { icon: FlaskConical, color: "text-sky-700", bg: "bg-sky-50" },
  atlas_bottleneck: { icon: AlertTriangle, color: "text-amber-700", bg: "bg-amber-50" },
  atlas_growth_brief: { icon: Telescope, color: "text-sky-800", bg: "bg-sky-50" },
  fern_opportunity: { icon: Download, color: "text-emerald-800", bg: "bg-emerald-50" },
  fern_experiment: { icon: Sprout, color: "text-emerald-700", bg: "bg-emerald-50" },
  fern_forecast: { icon: TrendingUp, color: "text-emerald-700", bg: "bg-emerald-50" },
  fern_acquisition: { icon: Download, color: "text-emerald-800", bg: "bg-emerald-50" },
  echo_feature_request: { icon: MessageCircleHeart, color: "text-rose-800", bg: "bg-rose-50" },
  echo_sentiment: { icon: TrendingUp, color: "text-rose-700", bg: "bg-rose-50" },
  echo_churn: { icon: AlertTriangle, color: "text-amber-800", bg: "bg-amber-50" },
  echo_love: { icon: Heart, color: "text-pink-700", bg: "bg-pink-50" },
  echo_voc_report: { icon: MessageCircleHeart, color: "text-rose-800", bg: "bg-rose-50" },
  echo_voc_scan: { icon: MessageCircleHeart, color: "text-rose-700", bg: "bg-rose-50" },
  collab_message: { icon: Mail, color: "text-sky-800", bg: "bg-sky-50" },
  collab_task: { icon: ListTodo, color: "text-violet-800", bg: "bg-violet-50" },
  collab_event: { icon: GitBranch, color: "text-violet-700", bg: "bg-violet-50" },
  collab_task_done: { icon: CheckSquare, color: "text-emerald-700", bg: "bg-emerald-50" },
};

const priorityRing: Record<string, string> = {
  high: "border-l-rose-400",
  medium: "border-l-amber-400",
  low: "border-l-brand-sage",
};

export function ActivityFeedItem({
  item,
  index,
  isSelected,
  onSelect,
  onApprove,
  onEdit,
  onReject,
}: {
  item: ActivityItem;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onEdit: () => void;
  onReject: () => void;
}) {
  const config = typeConfig[item.type];
  const Icon = config.icon;

  return (
    <article
      className={cn(
        "hq-feed-item cursor-pointer rounded-2xl border border-brand-border/70 bg-white/80 p-4 backdrop-blur-sm transition-all hover:border-brand-accent/40 hover:shadow-md",
        isSelected && "border-brand-accent/50 bg-white shadow-md ring-1 ring-brand-accent/20",
        item.priority && `border-l-4 ${priorityRing[item.priority]}`
      )}
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      role="button"
      tabIndex={0}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            config.bg,
            config.color
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-sage">
              {ACTIVITY_LABELS[item.type]}
            </span>
            {item.platform && (
              <span className="rounded-md bg-brand-bg px-1.5 py-0.5 text-[10px] text-brand-muted">
                {item.platform}
              </span>
            )}
            <span className="ml-auto text-[10px] text-brand-sage">{item.timestamp}</span>
          </div>
          <h3 className="mt-1 font-heading text-sm font-semibold text-brand-primary">{item.title}</h3>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-brand-muted">{item.summary}</p>

          {(item.type === "approval_needed" || item.type === "reply_awaiting_approval") && item.status === "pending" && (
            <div className="mt-3" onClick={(e) => e.stopPropagation()}>
              <ApprovalFeedItem
                item={item}
                onApprove={onApprove}
                onEdit={onEdit}
                onReject={onReject}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
