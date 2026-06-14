/** Generate a help-first PlantPal reply draft — no links, no promotion. */
export function suggestPlantPalReply(input: {
  title: string;
  body: string;
  subreddit?: string;
}): string {
  const blob = `${input.title} ${input.body}`.toLowerCase();

  if (/yellow|wilting|droopy|dying|sad/.test(blob)) {
    return "Yellow leaves usually mean too much water or not enough light — not that your plant hates you. Check whether the soil is actually dry an inch down before watering again, and make sure it's getting bright indirect light. Happy to help narrow it down if you share the plant type.";
  }
  if (/root rot|overwater|mushy|soggy|drowning/.test(blob)) {
    return "If the soil stays wet and the stems feel mushy, that's classic overwatering. Pull it out of the wet soil, trim anything black or soft, and repot in fresh mix that's actually dry. Let it recover in bright indirect light before watering again.";
  }
  if (/pest|gnat|mite|bug|aphid/.test(blob)) {
    return "Pests happen to every plant parent eventually. Isolate the plant, wipe leaves with a damp cloth, and check the soil for fungus gnats. Neem oil or insecticidal soap works for most houseplant pests — consistency beats one heroic spray.";
  }
  if (/propagat|cutting|water propagate/.test(blob)) {
    return "Propagation is mostly patience. A node in water or moist soil, bright indirect light, and resist the urge to check every hour. Change the water weekly if you're rooting in water — roots usually show up in 2–4 weeks for most common houseplants.";
  }

  return "Good question — plant care is usually about matching water and light to what the plant actually wants, not what we wish it wanted. Check soil moisture before watering and give it bright indirect light if you're unsure. Happy to dig in more if you share details.";
}
