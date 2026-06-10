export type SproutPlatform = "Instagram" | "TikTok" | "X" | "Threads" | "Pinterest" | "YouTube";

export interface PostingTimeSlot {
  platform: SproutPlatform;
  label: string;
  score: number;
  dayOfWeek: number;
  hour: number;
  rationale: string;
}

const PLATFORM_SLOTS: Record<SproutPlatform, Omit<PostingTimeSlot, "platform">[]> = {
  Instagram: [
    { label: "Wed 11:00 AM EST", score: 86, dayOfWeek: 3, hour: 11, rationale: "Mid-week lunch scroll — high carousel saves" },
    { label: "Sat 10:00 AM EST", score: 84, dayOfWeek: 6, hour: 10, rationale: "Weekend planning — strong save rate for guides" },
    { label: "Tue 7:00 PM EST", score: 81, dayOfWeek: 2, hour: 19, rationale: "Evening reels discovery window" },
  ],
  TikTok: [
    { label: "Tue 7:00 PM EST", score: 91, dayOfWeek: 2, hour: 19, rationale: "Peak Gen-Z plant parent engagement" },
    { label: "Thu 7:00 PM EST", score: 89, dayOfWeek: 4, hour: 19, rationale: "Duet/stitch discovery spike" },
    { label: "Sat 9:00 AM EST", score: 82, dayOfWeek: 6, hour: 9, rationale: "Morning hobby scroll" },
  ],
  X: [
    { label: "Wed 9:00 AM EST", score: 85, dayOfWeek: 3, hour: 9, rationale: "Morning commute thread reading" },
    { label: "Mon 12:00 PM EST", score: 80, dayOfWeek: 1, hour: 12, rationale: "Lunch-break hot takes" },
    { label: "Thu 5:00 PM EST", score: 78, dayOfWeek: 4, hour: 17, rationale: "End-of-day gardening vent posts" },
  ],
  Threads: [
    { label: "Wed 8:00 AM EST", score: 83, dayOfWeek: 3, hour: 8, rationale: "Morning community discussion" },
    { label: "Sun 6:00 PM EST", score: 79, dayOfWeek: 0, hour: 18, rationale: "Weekend reflection threads" },
  ],
  Pinterest: [
    { label: "Sat 2:00 PM EST", score: 87, dayOfWeek: 6, hour: 14, rationale: "Weekend project planning peak" },
    { label: "Sun 10:00 AM EST", score: 84, dayOfWeek: 0, hour: 10, rationale: "Inspiration board saves" },
  ],
  YouTube: [
    { label: "Sat 11:00 AM EST", score: 88, dayOfWeek: 6, hour: 11, rationale: "Weekend Shorts binge window" },
    { label: "Wed 6:00 PM EST", score: 82, dayOfWeek: 3, hour: 18, rationale: "After-work how-to searches" },
  ],
};

export function getBestPostingTime(platform: SproutPlatform): PostingTimeSlot {
  const slots = PLATFORM_SLOTS[platform];
  const best = slots.reduce((a, b) => (a.score >= b.score ? a : b));
  return { platform, ...best };
}

export function getAllPostingRecommendations(): PostingTimeSlot[] {
  return (Object.keys(PLATFORM_SLOTS) as SproutPlatform[]).map(getBestPostingTime);
}

export function formatToPlatform(format: string): SproutPlatform | null {
  const map: Record<string, SproutPlatform> = {
    x_post: "X",
    threads_post: "Threads",
    tiktok_concept: "TikTok",
    reels_concept: "Instagram",
    shorts_concept: "YouTube",
    carousel: "Instagram",
  };
  return map[format] ?? null;
}

export function nextSlotDate(dayOfWeek: number, hour: number): Date {
  const now = new Date();
  const result = new Date(now);
  const currentDay = now.getDay();
  let daysAhead = dayOfWeek - currentDay;
  if (daysAhead <= 0) daysAhead += 7;
  result.setDate(result.getDate() + daysAhead);
  result.setHours(hour, 0, 0, 0);
  return result;
}
