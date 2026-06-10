"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  opacity: number;
}

export function HQAmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx2 = canvas.getContext("2d");
    if (!ctx2) return;

    const canvasEl = canvas;
    const ctx = ctx2;
    let animationId: number;
    const particles: Particle[] = Array.from({ length: 24 }, () => ({
      x: Math.random() * canvasEl.width,
      y: Math.random() * canvasEl.height,
      size: 2 + Math.random() * 3,
      speed: 0.2 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.3,
      opacity: 0.15 + Math.random() * 0.25,
    }));

    function resize() {
      const parent = canvasEl.parentElement;
      if (!parent) return;
      canvasEl.width = parent.clientWidth;
      canvasEl.height = parent.clientHeight;
    }

    resize();
    const parentEl = canvasEl.parentElement;
    if (!parentEl) return;
    const ro = new ResizeObserver(resize);
    ro.observe(parentEl);

    function draw() {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      for (const p of particles) {
        p.y += p.speed;
        p.x += p.drift;
        if (p.y > canvasEl.height) {
          p.y = -10;
          p.x = Math.random() * canvasEl.width;
        }
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.6, Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(116, 195, 101, ${p.opacity})`;
        ctx.fill();
      }
      animationId = requestAnimationFrame(draw);
    }

    draw();

    gsap.to(canvasEl, { opacity: 1, duration: 2, ease: "power2.out" });

    return () => {
      cancelAnimationFrame(animationId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[1] opacity-0"
      aria-hidden
    />
  );
}
