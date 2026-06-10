import type { PartnershipIdeaType } from "@/lib/types";

export interface MockCreatorInput {
  name: string;
  handle: string;
  platform: string;
  category: string;
  followers: number;
  engagementRate: number;
  averageViews: number;
  location: string;
  email: string;
  website: string;
  source: string;
  audienceFit: number;
  engagementScore: number;
  postingFrequency: number;
  contentQuality: number;
  growthTrend: number;
  notes: string;
  ideas: { title: string; ideaType: PartnershipIdeaType; description: string }[];
}

const POOL: MockCreatorInput[] = [
  {
    name: "Urban Harvest Co",
    handle: "@urbanharvestco",
    platform: "TikTok",
    category: "Urban Farming",
    followers: 67000,
    engagementRate: 5.8,
    averageViews: 38000,
    location: "Brooklyn, NY",
    email: "collab@urbanharvest.co",
    website: "",
    source: "TikTok",
    audienceFit: 86,
    engagementScore: 82,
    postingFrequency: 88,
    contentQuality: 84,
    growthTrend: 79,
    notes: "Rooftop garden content. Strong Gen-Z audience.",
    ideas: [
      { title: "Rooftop Rescue Challenge", ideaType: "plant_rescue", description: "Document rescuing neglected rooftop plants with PlantPal care tracking." },
    ],
  },
  {
    name: "Dr. Garden Podcast",
    handle: "@drgardenpod",
    platform: "Podcasts",
    category: "Garden Education",
    followers: 45000,
    engagementRate: 4.2,
    averageViews: 12000,
    location: "Nashville, TN",
    email: "hello@drgardenpod.com",
    website: "https://drgardenpod.com",
    source: "Podcasts",
    audienceFit: 78,
    engagementScore: 70,
    postingFrequency: 65,
    contentQuality: 90,
    growthTrend: 72,
    notes: "Weekly podcast on beginner gardening. Sponsor potential.",
    ideas: [
      { title: "PlantPal Beginner Series", ideaType: "product_review", description: "Honest review episode — first 30 days with PlantPal for new gardeners." },
    ],
  },
  {
    name: "Seed & Soul Blog",
    handle: "@seedandsoul",
    platform: "Blogs",
    category: "Organic Gardening",
    followers: 22000,
    engagementRate: 6.5,
    averageViews: 8500,
    location: "Asheville, NC",
    email: "write@seedandsoul.blog",
    website: "https://seedandsoul.blog",
    source: "Blogs",
    audienceFit: 84,
    engagementScore: 75,
    postingFrequency: 70,
    contentQuality: 88,
    growthTrend: 68,
    notes: "Long-form organic gardening guides. SEO strong.",
    ideas: [
      { title: "Organic Care Calendar Collab", ideaType: "garden_transformation", description: "6-week organic garden transformation with PlantPal scheduling." },
    ],
  },
  {
    name: "Patio Paradise",
    handle: "@patioparadise",
    platform: "Pinterest",
    category: "Container Gardening",
    followers: 91000,
    engagementRate: 3.8,
    averageViews: 15000,
    location: "San Diego, CA",
    email: "",
    website: "https://patioparadise.pinterest",
    source: "Pinterest",
    audienceFit: 80,
    engagementScore: 68,
    postingFrequency: 72,
    contentQuality: 85,
    growthTrend: 74,
    notes: "Visual container garden boards. High save rate.",
    ideas: [
      { title: "Container Garden Giveaway", ideaType: "giveaway", description: "Giveaway: patio starter kit + 1-year PlantPal premium." },
    ],
  },
  {
    name: "Landscape Liz",
    handle: "@landscapeliz",
    platform: "YouTube",
    category: "Landscaping",
    followers: 156000,
    engagementRate: 4.5,
    averageViews: 72000,
    location: "Phoenix, AZ",
    email: "liz@landscapeliz.com",
    website: "",
    source: "YouTube",
    audienceFit: 75,
    engagementScore: 72,
    postingFrequency: 60,
    contentQuality: 91,
    growthTrend: 70,
    notes: "Professional landscaper. Desert gardening niche.",
    ideas: [
      { title: "Desert Xeriscape Series", ideaType: "garden_transformation", description: "Transform a water-hungry yard into xeriscape with PlantPal drought reminders." },
    ],
  },
];

function avg(nums: number[]) {
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function generateMockCreators(count: number): (MockCreatorInput & { partnershipScore: number; priority: "normal" | "high" })[] {
  const shuffled = [...POOL].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((c) => {
    const partnershipScore = avg([
      c.audienceFit,
      c.engagementScore,
      c.postingFrequency,
      c.contentQuality,
      c.growthTrend,
    ]);
    return {
      ...c,
      partnershipScore,
      priority: partnershipScore >= 82 ? "high" as const : "normal" as const,
    };
  });
}
