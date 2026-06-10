"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HQWeatherState } from "@/lib/hq/hq-weather";
import type { DayPhase } from "@/lib/hq/world-time";

const STORAGE_KEY = "plantpal-hq-ambient-sound";

function createNoiseBuffer(ctx: AudioContext, seconds = 2) {
  const size = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  return buffer;
}

/** Procedural garden ambience — adapts to weather and day phase */
export function useAmbientSound(weather?: HQWeatherState, dayPhase?: DayPhase) {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);

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
        if ("stop" in n && typeof n.stop === "function") (n as OscillatorNode).stop();
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

    const isNight = dayPhase === "night" || dayPhase === "dusk";
    const isRain = weather?.isRaining ?? false;

    const master = ctx.createGain();
    master.gain.value = isNight ? 0.028 : isRain ? 0.045 : 0.04;
    master.connect(ctx.destination);
    nodesRef.current.push(master);

    const gardenFreqs = isNight ? [146.83, 220, 293.66] : [196, 293.66, 392];
    const gardenGain = isNight ? 0.1 : isRain ? 0.08 : 0.15;

    for (const freq of gardenFreqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isNight ? "triangle" : "sine";
      osc.frequency.value = freq;
      gain.gain.value = gardenGain;
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      nodesRef.current.push(osc, gain);
    }

    if (isRain) {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 3);
      noise.loop = true;
      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = "lowpass";
      rainFilter.frequency.value = 900;
      const rainGain = ctx.createGain();
      rainGain.gain.value = 0.12;
      noise.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(master);
      noise.start();
      nodesRef.current.push(noise, rainFilter, rainGain);
    }
  }, [dayPhase, weather?.isRaining, stop]);

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
