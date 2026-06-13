import {
  BarChart3,
  Bot,
  CalendarDays,
  CheckSquare,
  Eye,
  FileBarChart,
  FileText,
  GitBranch,
  Radar,
  Brain,
  Inbox,
  Rocket,
  Crown,
  Telescope,
  Image,
  LayoutDashboard,
  MessageSquare,
  Search,
  Server,
  Sparkles,
  Star,
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

export type NavEntry = NavItem | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

/**
 * Phase 34 — six top-level destinations only.
 * HQ · Content · Approvals · Calendar · Analytics · Settings
 * Everything else lives as a sub-page inside one of the groups.
 */
export const navMenu: NavEntry[] = [
  { href: "/", label: "HQ", icon: LayoutDashboard },
  {
    label: "Content",
    icon: Sparkles,
    items: [
      { href: "/content-factory", label: "Content Factory", icon: Zap },
      { href: "/intelligence", label: "Intelligence", icon: Radar },
      { href: "/creative", label: "Creative", icon: Image },
      { href: "/seo", label: "SEO", icon: Search },
      { href: "/reddit", label: "Reddit", icon: MessageSquare },
      { href: "/content", label: "Studio", icon: Sparkles },
      { href: "/agents/pipeline", label: "Content Router", icon: Workflow },
      { href: "/images", label: "Image Studio", icon: Image },
      { href: "/video", label: "Video Studio", icon: Video },
      { href: "/blog-pipeline", label: "Blog Pipeline", icon: FileText },
      { href: "/social", label: "Social Posts", icon: FileText },
      { href: "/replies", label: "Reply Drafts", icon: MessageSquare },
      { href: "/community", label: "Community", icon: Eye },
      { href: "/creators", label: "Creators", icon: Telescope },
    ],
  },
  { href: "/approvals", label: "Approvals", icon: CheckSquare },
  { href: "/inbox", label: "Founder Inbox", icon: Inbox },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  {
    label: "Analytics",
    icon: BarChart3,
    items: [
      { href: "/analytics", label: "Overview", icon: BarChart3 },
      { href: "/founder", label: "Founder Mode", icon: Crown },
      { href: "/company-os", label: "Company OS", icon: Workflow },
      { href: "/agents/daily-brief", label: "Ivy Executive Brief", icon: Bot },
      { href: "/daily-report", label: "Daily Report", icon: FileBarChart },
      { href: "/agents/scores", label: "Content Scores", icon: Star },
      { href: "/competitors", label: "Competitors", icon: Radar },
      { href: "/launch", label: "Launch Readiness", icon: Rocket },
      { href: "/x", label: "X Dashboard", icon: Twitter },
    ],
  },
  {
    label: "Settings",
    icon: Server,
    items: [
      { href: "/agents", label: "Agents", icon: Users },
      { href: "/brand", label: "Brand Brain", icon: Brain },
      { href: "/integrations", label: "Integrations", icon: Plug },
      { href: "/agent-operations", label: "Operations", icon: Server },
      { href: "/system-health", label: "System Health", icon: Server },
      { href: "/automation/schedules", label: "Schedules", icon: Zap },
      { href: "/automation", label: "Automation", icon: Zap },
      { href: "/collaboration", label: "Collaboration", icon: GitBranch },
      { href: "/agent-brain", label: "Agent Brain", icon: Brain },
      { href: "/admin/setup-health", label: "Setup Health", icon: Server },
      { href: "/admin/f5bot-test", label: "F5Bot Test", icon: Radar },
      { href: "/admin/video-diagnostics", label: "Video Diagnostics", icon: Video },
    ],
  },
];

/** Legacy exports — derived from the new six-item menu. */
export const mainNavItems: NavItem[] = navMenu.filter(
  (entry): entry is NavItem => !isNavGroup(entry)
);

export const navGroups: NavGroup[] = navMenu.filter(isNavGroup);

/** Flat list kept for any legacy consumers. */
export const navItems = [
  ...mainNavItems,
  ...navGroups.flatMap((group) => group.items),
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
