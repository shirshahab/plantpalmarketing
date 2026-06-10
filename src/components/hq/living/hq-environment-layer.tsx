"use client";

import { motion } from "framer-motion";
import type { DayPhase, Season } from "@/lib/hq/world-time";

export function HQEnvironmentLayer({ phase, season }: { phase: DayPhase; season: Season }) {
  const showFireflies = phase === "night" || phase === "dusk";
  const showBirds = phase === "dawn" || phase === "day";
  const petalColor = season === "spring" ? "#f9a8d4" : season === "autumn" ? "#fb923c" : "#fde047";

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      {/* Clouds */}
      {[12, 45, 78].map((left, i) => (
        <motion.div
          key={`cloud-${i}`}
          className="hq-cloud absolute top-[6%] h-6 w-14 rounded-full bg-white/50 sm:h-8 sm:w-20"
          style={{ left: `${left}%` }}
          animate={{ x: [0, 30, 0], opacity: phase === "night" ? [0.1, 0.15, 0.1] : [0.45, 0.6, 0.45] }}
          transition={{ duration: 28 + i * 6, repeat: Infinity, ease: "easeInOut" }}
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

      {/* Season petals / snow */}
      {Array.from({ length: season === "winter" ? 8 : 10 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute h-1 w-1 rounded-full"
          style={{
            left: `${(i * 17) % 100}%`,
            backgroundColor: season === "winter" ? "#fff" : petalColor,
            opacity: 0.5,
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

      {/* Swaying trees at edges */}
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
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
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
