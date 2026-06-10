"use client";

import { motion } from "framer-motion";
import type { DayPhase, Season } from "@/lib/hq/world-time";
import type { HQWeatherState } from "@/lib/hq/hq-weather";

export function HQEnvironmentLayer({
  phase,
  season,
  weather,
}: {
  phase: DayPhase;
  season: Season;
  weather: HQWeatherState;
}) {
  const showFireflies = (phase === "night" || phase === "dusk") && weather.condition !== "rain" && weather.condition !== "storm";
  const showBirds =
    (phase === "dawn" || phase === "day") &&
    weather.condition !== "rain" &&
    weather.condition !== "storm" &&
    weather.condition !== "snow";
  const petalColor = season === "spring" ? "#f9a8d4" : season === "autumn" ? "#fb923c" : "#fde047";
  const showRain = weather.condition === "rain" || weather.condition === "drizzle" || weather.condition === "storm";
  const showSnow = weather.condition === "snow";
  const rainCount = Math.round(18 * weather.particleDensity);
  const snowCount = Math.round(14 * weather.particleDensity);
  const cloudCount = weather.condition === "storm" ? 5 : weather.condition === "clouds" || weather.condition === "mist" ? 4 : 3;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      {/* Sun rays on clear days */}
      {weather.condition === "clear" && phase === "day" && (
        <motion.div
          className="absolute left-[20%] top-[2%] h-24 w-24 rounded-full bg-yellow-200/30 blur-2xl"
          animate={{ opacity: [0.4, 0.65, 0.4], scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Clouds */}
      {Array.from({ length: cloudCount }).map((_, i) => (
        <motion.div
          key={`cloud-${i}`}
          className="hq-cloud absolute top-[5%] h-6 w-14 rounded-full bg-white/50 sm:h-8 sm:w-20"
          style={{
            left: `${10 + i * 18}%`,
            opacity: weather.cloudOpacity * (phase === "night" ? 0.35 : 1),
          }}
          animate={{
            x: [0, 20 + weather.windIntensity * 24, 0],
            opacity: [
              weather.cloudOpacity * 0.6,
              weather.cloudOpacity,
              weather.cloudOpacity * 0.6,
            ],
          }}
          transition={{ duration: 24 + i * 5, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Rain */}
      {showRain &&
        Array.from({ length: rainCount }).map((_, i) => (
          <motion.div
            key={`rain-${i}`}
            className="absolute h-3 w-px rounded-full bg-sky-400/70"
            style={{ left: `${(i * 13) % 100}%`, top: "-4%" }}
            animate={{
              y: ["0%", "108%"],
              x: [0, 6 + weather.windIntensity * 10],
              opacity: [0, 0.7, 0],
            }}
            transition={{
              duration: 0.6 + (i % 4) * 0.12,
              repeat: Infinity,
              delay: (i % 7) * 0.08,
              ease: "linear",
            }}
          />
        ))}

      {/* Snow */}
      {showSnow &&
        Array.from({ length: snowCount }).map((_, i) => (
          <motion.div
            key={`snow-${i}`}
            className="absolute h-1 w-1 rounded-full bg-white/90"
            style={{ left: `${(i * 11) % 100}%`, top: "-3%" }}
            animate={{
              y: ["0%", "105%"],
              x: [0, (i % 2 === 0 ? 8 : -8) * weather.windIntensity],
            }}
            transition={{
              duration: 4 + (i % 5),
              repeat: Infinity,
              delay: i * 0.2,
              ease: "linear",
            }}
          />
        ))}

      {/* Birds */}
      {showBirds &&
        [20, 55, 85].map((left, i) => (
          <motion.div
            key={`bird-${i}`}
            className="absolute text-[10px] text-brand-primary/40"
            style={{ top: `${10 + i * 3}%`, left: `${left}%` }}
            animate={{ x: [0, 40, 80], y: [0, -8, 0] }}
            transition={{ duration: 12 + i * 3, repeat: Infinity, ease: "linear", delay: i * 2 }}
          >
            ˇ ˇ
          </motion.div>
        ))}

      {/* Pond ripple at customer garden */}
      <motion.div
        className="absolute rounded-full border border-sky-300/40"
        style={{ left: "42%", top: "78%", width: "16%", height: "4%" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.15, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Season petals (when not snowing) */}
      {!showSnow &&
        season !== "winter" &&
        Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute h-1 w-1 rounded-full"
            style={{
              left: `${(i * 17) % 100}%`,
              backgroundColor: petalColor,
              opacity: 0.45,
            }}
            animate={{
              y: ["-5%", "105%"],
              x: [0, (i % 2 === 0 ? 12 : -12), 0],
              rotate: [0, 180],
            }}
            transition={{
              duration: 8 + (i % 5),
              repeat: Infinity,
              delay: i * 0.7,
              ease: "linear",
            }}
          />
        ))}

      {/* Fireflies at night */}
      {showFireflies &&
        [15, 35, 60, 82].map((left, i) => (
          <motion.div
            key={`fly-${i}`}
            className="absolute h-1 w-1 rounded-full bg-lime-300"
            style={{ left: `${left}%`, top: `${40 + (i % 3) * 15}%` }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.4, 0.8] }}
            transition={{ duration: 2 + i * 0.4, repeat: Infinity }}
          />
        ))}

      {/* Swaying trees — wind-reactive */}
      {[
        { x: 4, y: 18 },
        { x: 94, y: 16 },
        { x: 5, y: 72 },
        { x: 93, y: 70 },
      ].map((t, i) => (
        <motion.div
          key={`tree-${i}`}
          className="absolute"
          style={{ left: `${t.x}%`, top: `${t.y}%` }}
          animate={{ rotate: [-2 - weather.windIntensity * 3, 2 + weather.windIntensity * 3, -2 - weather.windIntensity * 3] }}
          transition={{ duration: 3 + i * 0.5 - weather.windIntensity, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="24" height="32" viewBox="0 0 24 32" className="opacity-50" aria-hidden>
            <rect x="10" y="18" width="4" height="12" fill="#92400e" />
            <circle cx="12" cy="14" r="10" fill="#2d6a4f" opacity="0.55" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
