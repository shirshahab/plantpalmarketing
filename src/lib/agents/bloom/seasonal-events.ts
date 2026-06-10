export interface SeasonalEvent {
  title: string;
  theme: string;
  hookAngle: string;
  urgency: "low" | "medium" | "high";
}

function monthDay(): { month: number; day: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, day: now.getDate() };
}

const CALENDAR: { startMonth: number; startDay: number; endMonth: number; endDay: number; event: SeasonalEvent }[] = [
  {
    startMonth: 3, startDay: 1, endMonth: 3, endDay: 20,
    event: { title: "Spring planting kickoff", theme: "seed starting & soil prep", hookAngle: "Your first tomato of the season starts today", urgency: "high" },
  },
  {
    startMonth: 3, startDay: 21, endMonth: 4, endDay: 30,
    event: { title: "Earth Month", theme: "sustainable gardening", hookAngle: "One plant swap beats ten throwaway pots", urgency: "medium" },
  },
  {
    startMonth: 5, startDay: 1, endMonth: 5, endDay: 31,
    event: { title: "Last frost window", theme: "hardening off & transplanting", hookAngle: "Stop guessing frost dates — track your zone", urgency: "high" },
  },
  {
    startMonth: 6, startDay: 1, endMonth: 6, endDay: 30,
    event: { title: "Summer heat stress", theme: "watering & shade cloth", hookAngle: "Wilting at 3pm? Your plant isn't dramatic — it's thirsty", urgency: "high" },
  },
  {
    startMonth: 7, startDay: 1, endMonth: 7, endDay: 31,
    event: { title: "Mid-summer harvest", theme: "tomatoes & herbs", hookAngle: "The harvest flex your neighbors will screenshot", urgency: "medium" },
  },
  {
    startMonth: 8, startDay: 1, endMonth: 8, endDay: 31,
    event: { title: "Late summer pests", theme: "aphids & spider mites", hookAngle: "That sticky leaf isn't dew — here's the fix", urgency: "medium" },
  },
  {
    startMonth: 9, startDay: 1, endMonth: 9, endDay: 30,
    event: { title: "Fall planting", theme: "kale, mums & bulbs", hookAngle: "Fall gardeners are playing 4D chess", urgency: "medium" },
  },
  {
    startMonth: 10, startDay: 1, endMonth: 10, endDay: 31,
    event: { title: "Indoor plant season", theme: "light & humidity", hookAngle: "Your monstera moved inside — now what?", urgency: "high" },
  },
  {
    startMonth: 11, startDay: 1, endMonth: 11, endDay: 30,
    event: { title: "Holiday gifting plants", theme: "low-maintenance gifts", hookAngle: "The only gift that grows with them", urgency: "low" },
  },
  {
    startMonth: 12, startDay: 1, endMonth: 12, endDay: 31,
    event: { title: "Winter dormancy", theme: "rest & planning", hookAngle: "Your plant isn't dead — it's napping", urgency: "low" },
  },
  {
    startMonth: 1, startDay: 1, endMonth: 2, endDay: 28,
    event: { title: "Seed catalog season", theme: "planning & wishlists", hookAngle: "January gardeners are dangerous with a spreadsheet", urgency: "medium" },
  },
];

function inRange(m: number, d: number, sm: number, sd: number, em: number, ed: number): boolean {
  const cur = m * 100 + d;
  const start = sm * 100 + sd;
  const end = em * 100 + ed;
  if (start <= end) return cur >= start && cur <= end;
  return cur >= start || cur <= end;
}

export function getActiveSeasonalEvents(): SeasonalEvent[] {
  const { month, day } = monthDay();
  return CALENDAR.filter((c) => inRange(month, day, c.startMonth, c.startDay, c.endMonth, c.endDay)).map((c) => c.event);
}

export function getPrimarySeasonalEvent(): SeasonalEvent {
  const active = getActiveSeasonalEvents();
  if (active.length === 0) {
    return {
      title: "Year-round plant care",
      theme: "daily care routines",
      hookAngle: "The 30-second check that saves your favorite plant",
      urgency: "medium",
    };
  }
  return active.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.urgency] - order[b.urgency];
  })[0];
}
