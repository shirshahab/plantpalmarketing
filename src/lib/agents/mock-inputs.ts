export function getSeasonalContext(): string {
  const month = new Date().toLocaleString("en-US", { month: "long" });
  const seasonal: Record<string, string> = {
    January: "Indoor plant care, dormant pruning, seed catalog browsing, resolution gardeners",
    February: "Seed starting indoors, late winter repotting, grow light setups",
    March: "Spring prep, first outdoor planting in warm zones, tomato seed starting",
    April: "Frost dates, spring planting rush, raised bed setup, pollinator gardens",
    May: "Tomato planting, container gardens, Mother's Day plant gifts",
    June: "Heat stress, watering schedules, summer vegetable care, aphid season",
    July: "Vacation plant care, heat waves, harvest season, drought gardening",
    August: "Fall garden planning, late summer pruning, powdery mildew",
    September: "Fall planting, bulb orders, bringing plants indoors, harvest preservation",
    October: "First frost prep, bulb planting, leaf cleanup, indoor plant migration",
    November: "Holiday plant gifts, amaryllis forcing, winterizing gardens",
    December: "Poinsettia care, winter dormancy, gift plants, year-in-review gardens",
  };
  return `Current month: ${month}. ${seasonal[month] ?? "General gardening season."}`;
}

export const REDDIT_MOCK_SIGNALS = [
  "r/plantclinic: spike in 'yellow leaves' posts — overwatering confusion",
  "r/gardening: 'what app should I use' threads trending",
  "r/houseplants: monstera brown tips megathread active",
  "r/vegetablegardening: tomato blossom end rot questions up 40%",
  "r/landscaping: native plant garden debates heating up",
  "r/plantparenthood: 'I killed another succulent' confession posts viral",
];

export const TREND_MOCK_SIGNALS = [
  "Cottagecore balcony gardens on TikTok",
  "Plant parent burnout content rising",
  "AI plant identification fatigue — users want personalized care",
  "Seed starting setup tours trending on Reels",
  "Before/after garden transformations high engagement",
  "Gardening with kids weekend project content",
];

export async function getCompetitorSignalsFromDb(
  fetchAlerts: () => Promise<{ competitor: string; title: string; description: string }[]>
): Promise<string[]> {
  try {
    const alerts = await fetchAlerts();
    if (alerts.length === 0) {
      return [
        "Planta: AI watering reminders campaign",
        "PictureThis: viral plant ID TikTok challenge",
        "Greg: App Store ranking climb in Lifestyle",
      ];
    }
    return alerts.map((a) => `${a.competitor}: ${a.title} — ${a.description.slice(0, 120)}`);
  } catch {
    return ["Competitor data unavailable — using general market signals"];
  }
}
