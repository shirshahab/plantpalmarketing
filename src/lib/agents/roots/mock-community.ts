import type { OpportunityType, Sentiment } from "@/lib/types";

export interface MockMention {
  platform: string;
  author: string;
  content: string;
  url: string;
  sentiment: Sentiment;
  topic: string;
  question: string;
  opportunityType: OpportunityType;
  urgencyScore: number;
  opportunityScore: number;
  reply: string;
}

const POOL: MockMention[] = [
  {
    platform: "Reddit",
    author: "u/succulent_survivor",
    content: "I swear succulents are harder than tomatoes. Mine keep rotting from the inside. What am I doing wrong?",
    url: "https://reddit.com/r/succulents/mock1",
    sentiment: "frustrated",
    topic: "Succulent care",
    question: "Why do my succulents keep rotting?",
    opportunityType: "plant_problems",
    urgencyScore: 88,
    opportunityScore: 85,
    reply: "Inside-out rot is almost always overwatering, even when the top soil feels bone dry. Succulents like a drink. They don't like living in a swamp. Gritty fast-draining mix, water only when the leaves feel slightly soft, and ignore every weekly-watering reminder you've ever seen. What mix are they in right now?",
  },
  {
    platform: "X",
    author: "@newplantdad",
    content: "Just bought my first fiddle leaf fig. Terrified. Any survival tips?",
    url: "https://x.com/newplantdad/mock2",
    sentiment: "curious",
    topic: "Houseplant beginners",
    question: "How do I keep a fiddle leaf fig alive?",
    opportunityType: "beginner_questions",
    urgencyScore: 72,
    opportunityScore: 80,
    reply: "Fair to be terrified. FLFs are drama queens with a reputation to maintain. Bright indirect light, never move it (it holds grudges), and water only when the top two inches are dry. Usually every 7-10 days. Survive the first month and it'll stop testing you.",
  },
  {
    platform: "Facebook Groups",
    author: "Maria Lopez",
    content: "Our HOA won't let us replace grass with native plants. Anyone dealt with this? Looking for design ideas that pass review.",
    url: "https://facebook.com/groups/gardening/mock3",
    sentiment: "neutral",
    topic: "Landscaping restrictions",
    question: "How to design native gardens within HOA rules?",
    opportunityType: "landscaping",
    urgencyScore: 65,
    opportunityScore: 70,
    reply: "HOAs don't hate native plants. They hate surprises. Submit a plan with clean borders, mulch, and height limits and approval odds jump. Start with a 4x4 pollinator bed as the pilot, photograph how tidy it stays, and let the skeptics argue with the evidence.",
  },
  {
    platform: "Threads",
    author: "@zone9gardener",
    content: "Zone 9 fall planting — what should I start NOW? Feeling behind.",
    url: "https://threads.net/zone9gardener/mock4",
    sentiment: "curious",
    topic: "Seasonal planting",
    question: "What to plant in fall in zone 9?",
    opportunityType: "local_gardening",
    urgencyScore: 78,
    opportunityScore: 83,
    reply: "You're not behind. Zone 9 fall is the cheat code season. Broccoli, kale, carrots, garlic, all of it. Start brassicas now, direct-sow the root crops by mid-month, and enjoy growing things while the rest of the country scrapes ice.",
  },
  {
    platform: "YouTube Comments",
    author: "@gardenviewer99",
    content: "Can anyone ID this plant from my grandma's garden? Heart-shaped leaves, pink flowers, grows like crazy.",
    url: "https://youtube.com/comments/mock5",
    sentiment: "curious",
    topic: "Plant identification",
    question: "What plant has heart-shaped leaves and pink flowers?",
    opportunityType: "plant_identification",
    urgencyScore: 60,
    opportunityScore: 75,
    reply: "Heart-shaped leaves, pink flowers, grows like it's plotting something? My money's on bleeding heart (Dicentra), maybe hardy hibiscus depending on the bloom. Drop a photo of the leaf underside and a flower close-up and we can settle it. Grandma clearly knew what she was doing.",
  },
];

export function generateMockMentions(count: number): MockMention[] {
  const shuffled = [...POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
