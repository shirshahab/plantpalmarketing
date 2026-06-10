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
  const showFireflies =
    (phase === "night" || phase === "dusk") && !weather.isRaining && weather.condition !== "storm";
  const showBirds =
    (phase === "dawn" || phase === "day") &&
    !weather.isRaining &&
    weather.condition !== "storm" &&
    !weather.isSnowing;
  const petalColor = season === "spring" ? "#f9a8d4" : season === "autumn" ? "#fb923c" : "#fde047";
  const showRain = weather.isRaining;
  const showSnow = weather.isSnowing;
  const rainCount = Math.round(22 * weather.particleDensity);
  const snowCount = Math.round(16 * weather.particleDensity);
  const cloudCount = Math.max(2, Math.round(2 + weather.clouds / 25));
  const useSeasonalFallback = !weather.live;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      {/* Warm sunny light */}
      {weather.warmLight > 0.3 && phase === "day" && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 30% 0%, rgba(255,220,120,${weather.warmLight * 0.35}) 0%, transparent 70%)`,
          }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Cool cloudy tint */}
      {weather.coolTint > 0.25 && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(148,163,184,${weather.coolTint * 0.2}) 0%, rgba(186,230,253,${weather.coolTint * 0.12}) 100%)`,
          }}
        />
      )}

      {/* Rain atmosphere overlay */}
      {showRain && (
        <motion.div
          className="absolute inset-0 bg-sky-900/10"
          animate={{ opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      {/* Clouds — density from OpenWeather cloud cover */}
      {Array.from({ length: cloudCount }).map((_, i) => (
        <motion.div
          key={`cloud-${i}`}
          className="hq-cloud absolute top-[5%] h-6 w-14 rounded-full bg-white/50 sm:h-8 sm:w-20"
          style={{
            left: `${(8 + i * (80 / cloudCount)) % 88}%`,
            opacity: weather.cloudOpacity * (phase === "night" ? 0.35 : 1),
          }}
          animate={{
            x: [0, 18 + weather.windIntensity * 32, 0],
            opacity: [weather.cloudOpacity * 0.5, weather.cloudOpacity, weather.cloudOpacity * 0.5],
          }}
          transition={{ duration: 20 + i * 4, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Rain particles */}
      {showRain &&
        Array.from({ length: rainCount }).map((_, i) => (
          <motion.div
            key={`rain-${i}`}
            className="absolute h-4 w-px rounded-full bg-sky-400/75"
            style={{ left: `${(i * 11) % 100}%`, top: "-4%" }}
            animate={{
              y: ["0%", "110%"],
              x: [0, 8 + weather.windIntensity * 14],
              opacity: [0, 0.75, 0],
            }}
            transition={{
              duration: 0.55 + (i % 4) * 0.1,
              repeat: Infinity,
              delay: (i % 9) * 0.06,
              ease: "linear",
            }}
          />
        ))}

      {/* Snow — only when API reports snow */}
      {showSnow &&
        Array.from({ length: snowCount }).map((_, i) => (
          <motion.div
            key={`snow-${i}`}
            className="absolute h-1.5 w-1.5 rounded-full bg-white/90"
            style={{ left: `${(i * 9) % 100}%`, top: "-3%" }}
            animate={{
              y: ["0%", "108%"],
              x: [0, (i % 2 === 0 ? 10 : -10) * weather.windIntensity],
            }}
            transition={{
              duration: 4 + (i % 5),
              repeat: Infinity,
              delay: i * 0.18,
              ease: "linear",
            }}
          />
        ))}

      {showBirds &&
        [20, 55, 85].map((left, i) => (
          <motion.div
            key={`bird-${i}`}
            className="absolute text-[10px] text-brand-primary/40"
            style={{ top: `${10 + i * 3}%`, left: `${left}%` }}
            animate={{ x: [0, 40 + weather.windIntensity * 20, 80], y: [0, -8, 0] }}
            transition={{ duration: 12 + i * 3, repeat: Infinity, ease: "linear", delay: i * 2 }}
          />
        ))}

      <motion.div
        className="absolute rounded-full border border-sky-300/40"
        style={{ left: "42%", top: "78%", width: "16%", height: "4%" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.15, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Seasonal petals when live weather unavailable */}
      {useSeasonalFallback && !showSnow && season !== "winter" &&
        Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute h-1 w-1 rounded-full"
            style={{ left: `${(i * 17) % 100}%`, backgroundColor: petalColor, opacity: 0.45 }}
            animate={{
              y: ["-5%", "105%"],
              x: [0, (i % 2 === 0 ? 12 : -12), 0],
              rotate: [0, 180],
            }}
            transition={{ duration: 8 + (i % 5), repeat: Infinity, delay: i * 0.7, ease: "linear" }}
          />
        ))}

      {/* Light petal drift on clear live days */}
      {weather.live && weather.condition === "clear" && !showSnow &&
        Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={`live-petal-${i}`}
            className="absolute h-1 w-1 rounded-full"
            style={{ left: `${(i * 23) % 100}%`, backgroundColor: petalColor, opacity: 0.3 }}
            animate={{ y: ["-5%", "105%"], x: [0, 8, 0] }}
            transition={{ duration: 12 + i, repeat: Infinity, delay: i, ease: "linear" }}
          />
        ))}

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
          animate={{
            rotate: [
              -2 - weather.windIntensity * 5,
              2 + weather.windIntensity * 5,
              -2 - weather.windIntensity * 5,
            ],
          }}
          transition={{
            duration: Math.max(1.5, 3.5 - weather.windIntensity * 1.5),
            repeat: Infinity,
            ease: "easeInOut",
          }}
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
