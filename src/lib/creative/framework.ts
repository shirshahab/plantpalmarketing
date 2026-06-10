export const CONTENT_TYPES = [
  {
    key: "plant_er",
    label: "Plant ER",
    description: "Emergency rescues, last-chance saves, dramatic turnarounds.",
    examples: [
      "Can this plant be saved?",
      "The homeowner was about to throw this away.",
      "We gave this dying plant one last chance.",
    ],
  },
  {
    key: "plant_confessions",
    label: "Plant Confessions",
    description: "Vulnerable, relatable plant parent confessions.",
    examples: [
      "I killed 17 plants before learning this.",
      "My monstera almost died because of one mistake.",
    ],
  },
  {
    key: "garden_wins",
    label: "Garden Wins",
    description: "Before/after transformations and growth timelines.",
    examples: [
      "Before and after transformations",
      "Backyard makeovers",
      "Plant growth timelines",
    ],
  },
  {
    key: "beginner_mistakes",
    label: "Beginner Mistakes",
    description: "Call out the mistakes every new gardener makes.",
    examples: [
      "Stop watering like this.",
      "The mistake almost every new gardener makes.",
    ],
  },
  {
    key: "local_gardening",
    label: "Local Gardening",
    description: "Timely, location-specific gardening hooks.",
    examples: [
      "What to plant in Texas this month.",
      "California gardeners should do this now.",
    ],
  },
  {
    key: "plantpal_challenges",
    label: "PlantPal Challenges",
    description: "Challenge-based content that drives participation.",
    examples: [
      "30-Day Garden Challenge",
      "Save a Plant Challenge",
    ],
  },
  {
    key: "family_gardening",
    label: "Family Gardening",
    description: "Gardening with kids and weekend family projects.",
    examples: [
      "Gardening with kids",
      "Weekend garden projects",
    ],
  },
] as const;

export const OUTPUT_FORMATS = [
  { key: "tiktok", label: "TikTok Idea" },
  { key: "reels", label: "Reels Idea" },
  { key: "short_form_script", label: "Short-Form Script" },
  { key: "carousel", label: "Carousel Concept" },
  { key: "x", label: "X Post" },
  { key: "threads", label: "Threads Post" },
  { key: "blog", label: "Blog Idea" },
  { key: "push_notification", label: "Push Notification" },
  { key: "email_subject", label: "Email Subject Line" },
] as const;

export type CreativeContentType = (typeof CONTENT_TYPES)[number]["key"];
export type CreativeOutputFormat = (typeof OUTPUT_FORMATS)[number]["key"];

export const CONTENT_TYPE_LABELS: Record<CreativeContentType, string> = Object.fromEntries(
  CONTENT_TYPES.map((t) => [t.key, t.label])
) as Record<CreativeContentType, string>;

export const FORMAT_LABELS: Record<CreativeOutputFormat, string> = Object.fromEntries(
  OUTPUT_FORMATS.map((f) => [f.key, f.label])
) as Record<CreativeOutputFormat, string>;
