import {
  BarChart3,
  Bot,
  CalendarDays,
  CheckSquare,
  Eye,
  FileBarChart,
  FileText,
  Flower2,
  GitBranch,
  Brain,
  Rocket,
  Sprout,
  TreeDeciduous,
  Crown,
  Telescope,
  Handshake,
  Image,
  LayoutDashboard,
  MessageCircleHeart,
  MessageSquare,
  Radar,
  Server,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  Users,
  Video,
  Workflow,
  Plug,
  Twitter,
  Zap,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

/** Founder-priority operating pages — always visible at the top. */
export const mainNavItems: NavItem[] = [
  { href: "/", label: "PlantPal HQ", icon: LayoutDashboard },
  { href: "/agents/daily-brief", label: "Ivy Executive Brief", icon: Bot },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/automation", label: "Automation", icon: Zap },
  { href: "/approvals", label: "Approvals / Founder Inbox", icon: CheckSquare },
  { href: "/reddit", label: "Reddit", icon: MessageSquare },
  { href: "/content", label: "Content Studio", icon: Sparkles },
  { href: "/x", label: "Analytics", icon: BarChart3 },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/agent-operations", label: "Settings & Operations", icon: Server },
];

/** Every agent page lives under one collapsible "Agents" group. */
export const agentNavGroup: NavGroup = {
  label: "Agents",
  icon: Users,
  items: [
    { href: "/creators", label: "Scout — Creator CRM", icon: Telescope },
    { href: "/community", label: "Roots — Community", icon: Eye },
    { href: "/bloom", label: "Bloom — Content Production", icon: Flower2 },
    { href: "/sage", label: "Sage — Creative Director", icon: Star },
    { href: "/approvals", label: "Gate — Approvals", icon: CheckSquare },
    { href: "/sprout", label: "Sprout — Publishing", icon: Rocket },
    { href: "/competitors", label: "Sentinel — Competitors", icon: Radar },
    { href: "/oak", label: "Oak — Partnerships", icon: TreeDeciduous },
    { href: "/ivy", label: "Ivy — Chief of Staff", icon: Crown },
    { href: "/atlas", label: "Atlas — Head of Growth", icon: Sprout },
    { href: "/echo", label: "Echo — Voice of Customer", icon: MessageCircleHeart },
    { href: "/fern", label: "Fern — Visual Designer", icon: Sprout },
  ],
};

/** Secondary workspaces stay reachable without crowding the main nav. */
export const moreNavGroup: NavGroup = {
  label: "More",
  icon: GitBranch,
  items: [
    { href: "/daily-report", label: "Daily Report", icon: FileBarChart },
    { href: "/collaboration", label: "Agent Collaboration", icon: GitBranch },
    { href: "/agent-brain", label: "Agent Brain (AI)", icon: Brain },
    { href: "/agents/pipeline", label: "Content Pipeline", icon: Workflow },
    { href: "/agents/scores", label: "Content Scores", icon: Star },
    { href: "/agents/approved", label: "Approved Content", icon: ThumbsUp },
    { href: "/agents/rejected", label: "Rejected Content", icon: ThumbsDown },
    { href: "/social", label: "Social Posts", icon: FileText },
    { href: "/images", label: "Image Asset Studio", icon: Image },
    { href: "/video", label: "Video Studio", icon: Video },
    { href: "/replies", label: "Social Reply Drafts", icon: MessageSquare },
    { href: "/x", label: "X Dashboard", icon: Twitter },
    { href: "/partnerships", label: "Partnership Tracker (Legacy)", icon: Handshake },
    { href: "/executive", label: "Executive Dashboard (Legacy)", icon: BarChart3 },
  ],
};

export const navGroups: NavGroup[] = [agentNavGroup, moreNavGroup];

/** Flat list kept for any legacy consumers. */
export const navItems = [
  ...mainNavItems,
  ...agentNavGroup.items,
  ...moreNavGroup.items,
] as const;

export const contentFormats = [
  { key: "tiktok", label: "TikTok Script" },
  { key: "reels", label: "Reels Script" },
  { key: "instagram", label: "Instagram Caption" },
  { key: "x", label: "X / Threads Post" },
  { key: "carousel", label: "Carousel Copy" },
  { key: "blog", label: "Blog Idea" },
] as const;

export const imageCategories = [
  { key: "social_graphic", label: "Social Graphics" },
  { key: "app_screenshot", label: "App Screenshots" },
  { key: "educational", label: "Educational Visuals" },
  { key: "before_after", label: "Before / After" },
] as const;

export const partnershipTypes = [
  { key: "nursery", label: "Nurseries" },
  { key: "garden_center", label: "Garden Centers" },
  { key: "landscaper", label: "Landscapers" },
  { key: "botanical_garden", label: "Botanical Gardens" },
  { key: "influencer", label: "Influencers" },
  { key: "seed_company", label: "Seed Companies" },
  { key: "home_garden_brand", label: "Home & Garden Brands" },
] as const;
