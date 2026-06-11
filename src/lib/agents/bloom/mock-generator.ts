import { getPrimarySeasonalEvent } from "@/lib/agents/bloom/seasonal-events";
import type { BloomContentFormat, BloomSourceType } from "@/lib/types";

export const DAILY_QUOTA: Record<BloomContentFormat, number> = {
  x_post: 10,
  threads_post: 5,
  tiktok_concept: 5,
  reels_concept: 5,
  shorts_concept: 5,
  carousel: 3,
  blog_idea: 3,
  email_idea: 3,
};

export const FORMAT_PLATFORM: Record<BloomContentFormat, string> = {
  x_post: "X",
  threads_post: "Threads",
  tiktok_concept: "TikTok",
  reels_concept: "Instagram",
  shorts_concept: "YouTube",
  carousel: "Instagram",
  blog_idea: "Blog",
  email_idea: "Email",
};

const EMOTIONAL_TRIGGERS = [
  "curiosity",
  "nostalgia",
  "fear of failure",
  "pride",
  "humor",
  "urgency",
  "belonging",
  "surprise",
  "relief",
  "aspiration",
] as const;

export interface BloomInputSignal {
  sourceType: BloomSourceType;
  detail: string;
  topic: string;
}

export interface GeneratedBloomPiece {
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
  scheduledDate: string;
}

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function score(base: number, variance: number): number {
  return Math.min(100, Math.max(1, base + Math.floor(Math.random() * variance * 2) - variance));
}

// Phase 35 — every template below is written through the PlantPal Brand
// Brain: funny observation first, plant insight second, simple fix third.
// No corporate language, no listicles, no "grow with confidence" energy.
function buildHook(format: BloomContentFormat, topic: string, angle: string): string {
  const hooks: Record<BloomContentFormat, string[]> = {
    x_post: [
      `Your ${topic} isn't being dramatic. It's filing a complaint.`,
      `Hot take: most ${topic} problems are just the watering can's reign of terror.`,
      `The ${topic} situation in this house is currently under investigation.`,
    ],
    threads_post: [
      `Opinion: most ${topic} advice online was written by someone who's never killed a basil. I have. Several. 🧵`,
      `The ${topic} discourse needs to hear this.`,
      `Read every ${topic} thread in the community this week. The watering can is always the villain.`,
    ],
    tiktok_concept: [
      `POV: your ${topic} survives despite you`,
      `Your ${topic} is not okay. Here's the 10-second proof.`,
      `Rating ${topic} fails until someone calls a plant ambulance`,
    ],
    reels_concept: [
      `Before: crime scene. After: ${topic} redemption arc.`,
      `This ${topic} survived the roommate era. Respect.`,
      `Stop scrolling. Your ${topic} is in this video.`,
    ],
    shorts_concept: [
      `${topic} explained in 60 seconds, zero lectures`,
      `Why your ${topic} looks sad (it's not what you think)`,
      `The ${topic} mistake everyone makes by Wednesday`,
    ],
    carousel: [
      `Your ${topic} cheat sheet. Screenshot it before your plant notices.`,
      `Swipe: the ${topic} rescue plan, guilt not included`,
      `${topic}: what the plant wishes you knew (${angle})`,
    ],
    blog_idea: [
      `${topic}: what's actually going wrong, and the boring fix that works`,
      `The honest guide to ${topic}, written by someone who's killed a basil`,
      `${topic} mistakes, ranked by how guilty you should feel`,
    ],
    email_idea: [
      `Subject: Your ${topic} is judging you (a little)`,
      `Subject: The ${topic} fix that takes 10 seconds`,
      `Subject: RIP to last year's ${topic}. This year goes differently.`,
    ],
  };
  return pick(hooks[format], Math.floor(Math.random() * hooks[format].length));
}

function buildCaption(format: BloomContentFormat, topic: string, sourceDetail: string): string {
  const short = ["x_post", "threads_post"].includes(format);
  if (short) {
    return `${topic} keeps coming up in the community. ${sourceDetail.slice(0, 110)}. The fix is usually boring: stop doing the thing. PlantPal tells you which thing.`;
  }
  if (["tiktok_concept", "reels_concept", "shorts_concept"].includes(format)) {
    return `Concept: open on the ${topic} crime scene, deliver the 10-second fix, end on the glow-up. Humor first. No lectures. Source: ${sourceDetail.slice(0, 80)}.`;
  }
  if (format === "carousel") {
    return `Slide 1: the ${topic} accusation. Slides 2-4: what the plant is actually saying. Slide 5: the fix. Slide 6: PlantPal, for the chronically guilty. From: ${sourceDetail.slice(0, 60)}.`;
  }
  if (format === "blog_idea") {
    return `Outline: funny observation → why ${topic} goes wrong → the boring fix that works → when to panic (rarely) → PlantPal CTA. Angle from: ${sourceDetail.slice(0, 80)}.`;
  }
  return `Email: open with the ${topic} guilt we all share, one fix, one community win, soft PlantPal CTA. No pep talk. Triggered by: ${sourceDetail.slice(0, 80)}.`;
}

function buildCta(format: BloomContentFormat): string {
  const ctas: Record<BloomContentFormat, string> = {
    x_post: "PlantPal knows which plant is mad at you. Free.",
    threads_post: "PlantPal is free and it never says 'I told you so.' Link in bio.",
    tiktok_concept: "Link sticker: 'Fix my plant' → PlantPal",
    reels_concept: "Comment 'GUILTY' and we'll send the care plan",
    shorts_concept: "PlantPal — free, light judgment included",
    carousel: "Slide 6: PlantPal, because guessing hasn't worked",
    blog_idea: "CTA block: PlantPal keeps the schedule. You take the credit.",
    email_idea: "Button: open PlantPal → see who actually needs water (not the cactus)",
  };
  return ctas[format];
}

function scheduleOffset(format: BloomContentFormat, index: number): number {
  const daySpread: Record<BloomContentFormat, number> = {
    x_post: 0,
    threads_post: 0,
    tiktok_concept: 1,
    reels_concept: 1,
    shorts_concept: 2,
    carousel: 2,
    blog_idea: 3,
    email_idea: 3,
  };
  return daySpread[format] + Math.floor(index / 3);
}

export function buildInputSignals(inputs: {
  scoutTopics: string[];
  rootsTopics: string[];
  sentinelTopics: string[];
}): BloomInputSignal[] {
  const seasonal = getPrimarySeasonalEvent();
  const signals: BloomInputSignal[] = [
    {
      sourceType: "seasonal_event",
      detail: `${seasonal.title}: ${seasonal.theme}`,
      topic: seasonal.theme,
    },
  ];

  for (const t of inputs.scoutTopics.slice(0, 4)) {
    signals.push({ sourceType: "scout_discovery", detail: `Scout creator trend: ${t}`, topic: t });
  }
  for (const t of inputs.rootsTopics.slice(0, 4)) {
    signals.push({ sourceType: "roots_conversation", detail: `Community thread: ${t}`, topic: t });
  }
  for (const t of inputs.sentinelTopics.slice(0, 3)) {
    signals.push({ sourceType: "sentinel_alert", detail: `Competitor signal: ${t}`, topic: t });
  }

  if (signals.length < 5) {
    signals.push(
      { sourceType: "seasonal_event", detail: "Evergreen: beginner houseplant care", topic: "houseplant care" },
      { sourceType: "roots_conversation", detail: "Community: yellow leaves panic", topic: "yellow leaves" },
      { sourceType: "scout_discovery", detail: "Scout: garden transformation creators", topic: "garden makeover" },
    );
  }

  return signals;
}

export function generateDailyContent(signals: BloomInputSignal[]): GeneratedBloomPiece[] {
  const seasonal = getPrimarySeasonalEvent();
  const pieces: GeneratedBloomPiece[] = [];
  const today = new Date();
  let signalIdx = 0;

  for (const [format, count] of Object.entries(DAILY_QUOTA) as [BloomContentFormat, number][]) {
    for (let i = 0; i < count; i++) {
      const signal = signals[signalIdx % signals.length];
      signalIdx++;
      const topic = signal.topic || seasonal.theme;
      const scheduled = new Date(today);
      scheduled.setDate(scheduled.getDate() + scheduleOffset(format, i));

      const viralBase = signal.sourceType === "sentinel_alert" ? 72 : signal.sourceType === "roots_conversation" ? 68 : 62;
      const difficultyBase = ["tiktok_concept", "reels_concept", "shorts_concept"].includes(format) ? 58 : 42;

      pieces.push({
        format,
        platform: FORMAT_PLATFORM[format],
        title: `${FORMAT_PLATFORM[format]} — ${topic} (${i + 1})`,
        hook: buildHook(format, topic, seasonal.hookAngle),
        caption: buildCaption(format, topic, signal.detail),
        cta: buildCta(format),
        viralScore: score(viralBase, 12),
        emotionalTrigger: pick([...EMOTIONAL_TRIGGERS], i + pieces.length),
        difficultyScore: score(difficultyBase, 15),
        sourceType: signal.sourceType,
        sourceDetail: signal.detail,
        scheduledDate: scheduled.toISOString().slice(0, 10),
      });
    }
  }

  return pieces;
}

export const TOTAL_DAILY_PIECES = Object.values(DAILY_QUOTA).reduce((a, b) => a + b, 0);
