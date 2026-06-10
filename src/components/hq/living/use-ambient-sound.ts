"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "plantpal-hq-ambient-sound";

/** Gentle procedural garden ambience via Web Audio — no external assets */
export function useAmbientSound() {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "on") setEnabled(true);
    } catch {
      // ignore
    }
  }, []);

  const stop = useCallback(() => {
    nodesRef.current.forEach((n) => {
      try {
        n.stop();
        n.disconnect();
      } catch {
        // already stopped
      }
    });
    nodesRef.current = [];
    if (ctxRef.current) {
      void ctxRef.current.close();
      ctxRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.04;
    master.connect(ctx.destination);

    const freqs = [196, 293.66, 392];
    for (const freq of freqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      nodesRef.current.push(osc);
    }
  }, [stop]);

  useEffect(() => {
    if (enabled) start();
    else stop();
    return stop;
  }, [enabled, start, stop]);

  const toggle = useCallback(() => {
    setEnabled((v) => {
      const next = !v;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { enabled, toggle };
}
