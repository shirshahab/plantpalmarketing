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

function buildHook(format: BloomContentFormat, topic: string, angle: string): string {
  const hooks: Record<BloomContentFormat, string[]> = {
    x_post: [
      `Hot take: ${topic} isn't hard — you're just missing this one signal.`,
      `POV: you finally understand why your ${topic} keeps failing.`,
      `3 signs your ${topic} needs attention (most people ignore #2).`,
    ],
    threads_post: [
      `Thread: everything I wish I knew about ${topic} before killing my third plant 🧵`,
      `Unpopular opinion about ${topic} — and the data backs it up.`,
      `I asked 500 plant parents about ${topic}. Here's what surprised me.`,
    ],
    tiktok_concept: [
      `Day in the life: fixing ${topic} in 60 seconds`,
      `"Plant parent check" — ${angle}`,
      `Watch this before you touch your ${topic} again`,
    ],
    reels_concept: [
      `Before / after: ${topic} rescue in one week`,
      `The ${angle} — cinematic plant care reel`,
      `Stop scrolling if ${topic} is on your worry list`,
    ],
    shorts_concept: [
      `60-sec fix: ${topic} explained like you're five`,
      `Garden hack: ${angle}`,
      `Why your ${topic} looks sad (and the one fix)`,
    ],
    carousel: [
      `Swipe: 5-step ${topic} recovery guide`,
      `Save this: ${topic} cheat sheet for beginners`,
      `The ${angle} — slide-by-slide breakdown`,
    ],
    blog_idea: [
      `The complete guide to ${topic} without the guilt`,
      `Why ${angle} matters more than fertilizer`,
      `${topic}: mistakes, fixes, and what actually works`,
    ],
    email_idea: [
      `Subject: Your ${topic} checklist for this week`,
      `Subject: ${angle} — quick win inside`,
      `Subject: Don't ignore these ${topic} warning signs`,
    ],
  };
  return pick(hooks[format], Math.floor(Math.random() * hooks[format].length));
}

function buildCaption(format: BloomContentFormat, topic: string, sourceDetail: string): string {
  const short = ["x_post", "threads_post"].includes(format);
  if (short) {
    return `${topic} keeps showing up in our community. ${sourceDetail.slice(0, 120)} — PlantPal helps you act before it's too late.`;
  }
  if (["tiktok_concept", "reels_concept", "shorts_concept"].includes(format)) {
    return `Concept: Visual story around ${topic}. Open on the problem, show the fix with PlantPal's care timeline, close on the transformation. Source insight: ${sourceDetail.slice(0, 80)}.`;
  }
  if (format === "carousel") {
    return `Slide 1: Hook on ${topic}. Slides 2–4: diagnosis steps. Slide 5: PlantPal CTA. Inspired by: ${sourceDetail.slice(0, 60)}.`;
  }
  if (format === "blog_idea") {
    return `Outline: intro hook → common ${topic} mistakes → science-backed fixes → PlantPal workflow → reader checklist. Research angle from: ${sourceDetail.slice(0, 80)}.`;
  }
  return `Email body: personal opener about ${topic}, one actionable tip, social proof from community, soft CTA to open PlantPal. Triggered by: ${sourceDetail.slice(0, 80)}.`;
}

function buildCta(format: BloomContentFormat): string {
  const ctas: Record<BloomContentFormat, string> = {
    x_post: "Track your plant's care rhythm in PlantPal →",
    threads_post: "Save the thread — link in bio for PlantPal free trial",
    tiktok_concept: "Link sticker: 'Fix my plant' → PlantPal",
    reels_concept: "Comment 'CARE' for the free care plan template",
    shorts_concept: "Subscribe + try PlantPal — link below",
    carousel: "Slide 6: Download PlantPal — never guess watering again",
    blog_idea: "CTA block: Start your free PlantPal garden journal",
    email_idea: "Button: Open PlantPal → see your plant's schedule",
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
