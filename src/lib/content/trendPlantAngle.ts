export interface TrendInput {
  title: string;
  source: string;
  summary: string;
  category?: string;
  date?: string;
  weatherContext?: string;
}

export interface PlantAngleOutput {
  originalTrend: string;
  plantAngle: string;
  memeAngle: string;
  educationalAngle: string;
  suggestedPost: string;
  suggestedBlogIdea: string;
  suggestedVideoHook: string;
  riskLevel: "low" | "medium" | "high";
  shouldUse: boolean;
  skipReason?: string;
}

const SENSITIVE = [
  "death", "murder", "shooting", "war", "terror", "cancer", "suicide", "abuse",
  "earthquake", "flood deaths", "mass shooting", "genocide", "holocaust",
];

const POLITICAL = ["election", "president", "congress", "senate", "trump", "biden", "vote for"];

function isRisky(title: string, summary: string): string | null {
  const blob = `${title} ${summary}`.toLowerCase();
  for (const term of SENSITIVE) {
    if (blob.includes(term)) return `Sensitive topic: ${term}`;
  }
  for (const term of POLITICAL) {
    if (blob.includes(term)) return `Political topic skipped: ${term}`;
  }
  return null;
}

function weatherAngle(weather: string): string | null {
  const w = weather.toLowerCase();
  if (w.includes("heat") || w.includes("hot")) {
    return "Your garden is about to get cooked. Water before the sun commits crimes.";
  }
  if (w.includes("frost") || w.includes("cold")) {
    return "Bring the drama queens inside. Frost does not negotiate.";
  }
  if (w.includes("rain")) {
    return "Free water from the sky. Your outdoor plants are living their best life.";
  }
  return null;
}

export function createPlantAngleFromTrend(input: TrendInput): PlantAngleOutput {
  const risky = isRisky(input.title, input.summary);
  if (risky) {
    return {
      originalTrend: input.title,
      plantAngle: "",
      memeAngle: "",
      educationalAngle: "",
      suggestedPost: "",
      suggestedBlogIdea: "",
      suggestedVideoHook: "",
      riskLevel: "high",
      shouldUse: false,
      skipReason: risky,
    };
  }

  const title = input.title.toLowerCase();
  let plantAngle = "";
  let memeAngle = "";
  let educationalAngle = "";
  let riskLevel: "low" | "medium" | "high" = "low";

  if (input.weatherContext) {
    plantAngle = weatherAngle(input.weatherContext) ?? "";
  }

  if (!plantAngle && title.includes("spring clean")) {
    plantAngle = "Spring cleaning, but for the plants you have been emotionally neglecting.";
    memeAngle = "POV: your monstera hears you say 'I will repot you next week' for the 47th time.";
    educationalAngle = "Spring reset checklist: repot, prune dead leaves, check for pests, adjust watering.";
  } else if (title.includes("sport") || title.includes("game") || title.includes("championship")) {
    plantAngle = "Your fern has shown more resilience than half the teams this weekend.";
    memeAngle = "My plant's survival rate vs my fantasy team's win rate.";
    riskLevel = "medium";
  } else if (title.includes("heat") || title.includes("weather")) {
    plantAngle = plantAngle || "Heat wave incoming. Your pots dry out faster than your group chat.";
    educationalAngle = "How to protect houseplants during heat: shade, morning water, skip fertilizer.";
  } else {
    plantAngle =
      plantAngle ||
      `${input.title}: here's the plant-parent take. If it affects comfort, humidity, or routines, your plants feel it too.`;
    educationalAngle = `Turn "${input.title}" into a practical plant care lesson for beginners.`;
    memeAngle = `Your basil watching you overthink "${input.title.slice(0, 40)}" instead of checking soil moisture.`;
  }

  const suggestedPost = plantAngle.slice(0, 280);
  const suggestedBlogIdea = educationalAngle || `PlantPal guide: ${input.title} for houseplant parents`;
  const suggestedVideoHook = plantAngle.split(".")[0] ?? plantAngle;

  return {
    originalTrend: input.title,
    plantAngle,
    memeAngle,
    educationalAngle,
    suggestedPost,
    suggestedBlogIdea,
    suggestedVideoHook,
    riskLevel,
    shouldUse: Boolean(plantAngle),
  };
}
