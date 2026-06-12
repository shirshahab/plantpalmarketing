"use client";

import { useCallback, useRef, useState } from "react";

const MIN_ZOOM = 0.65;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.12;

function clampZoom(z: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +z.toFixed(2)));
}

function distanceBetweenTouches(t1: React.Touch, t2: React.Touch) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.hypot(dx, dy);
}

export function useWorldViewport() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null);

  const zoomIn = useCallback(() => {
    setZoom((z) => clampZoom(z + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => clampZoom(z - ZOOM_STEP));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const setPanPosition = useCallback((next: { x: number; y: number }) => {
    setPan(next);
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((z) => clampZoom(z + delta));
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    dragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStart.current = {
          distance: distanceBetweenTouches(e.touches[0], e.touches[1]),
          zoom,
        };
        dragging.current = false;
      } else if (e.touches.length === 1) {
        dragging.current = true;
        lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    },
    [zoom]
  );

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current) {
      e.preventDefault();
      const dist = distanceBetweenTouches(e.touches[0], e.touches[1]);
      const scale = dist / pinchStart.current.distance;
      setZoom(clampZoom(pinchStart.current.zoom * scale));
      return;
    }
    if (e.touches.length === 1 && dragging.current) {
      const dx = e.touches[0].clientX - lastPointer.current.x;
      const dy = e.touches[0].clientY - lastPointer.current.y;
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    dragging.current = false;
    pinchStart.current = null;
  }, []);

  return {
    zoom,
    pan,
    zoomIn,
    zoomOut,
    resetView,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    setPan: setPanPosition,
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
  };
}
