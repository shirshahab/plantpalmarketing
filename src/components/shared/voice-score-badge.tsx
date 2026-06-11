/**
 * Phase 35 — PlantPal Score badge.
 * 10 = unmistakably PlantPal · 8 = acceptable · 7 = needs revision · ≤6 = rejected.
 */
export function VoiceScoreBadge({ score, compact }: { score: number; compact?: boolean }) {
  const tone =
    score >= 8
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : score === 7
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : "bg-red-100 text-red-700 border-red-200";
  const label = score >= 8 ? "PlantPal voice" : score === 7 ? "Needs revision" : "Failed voice";

  return (
    <span
      title={`PlantPal Score: ${score}/10 — ${label}`}
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${tone}`}
    >
      🌱 {score}/10{!compact && <span className="font-semibold">{label}</span>}
    </span>
  );
}
