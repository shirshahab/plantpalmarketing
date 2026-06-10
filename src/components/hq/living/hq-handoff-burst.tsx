"use client";

import { motion, AnimatePresence } from "framer-motion";

export function HQHandoffBurst({
  label,
  x,
  y,
  visible,
}: {
  label: string;
  x: number;
  y: number;
  visible: boolean;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none absolute z-[15] -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${x}%`, top: `${y}%` }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <motion.div
            className="absolute -inset-4 rounded-full border-2 border-amber-400/60"
            animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
            transition={{ duration: 1.2, repeat: 2 }}
          />
          <div className="relative whitespace-nowrap rounded-2xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold text-amber-900 shadow-lg">
            ✦ {label}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
