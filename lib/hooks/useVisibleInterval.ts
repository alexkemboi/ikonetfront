"use client";

import { useEffect, useRef } from "react";

/**
 * Like `setInterval`, but only while the browser tab is visible; returns the function that stops
 * it. A hidden tab stops polling, so pages left open in the background no longer load the backend
 * all day. When the tab becomes visible again and a run is due, it runs at once. A run never
 * overlaps the previous one; a run that throws waits for the next one.
 */
export function visibleInterval(run: () => unknown, intervalMs: number): () => void {
  if (!(intervalMs > 0) || typeof document === "undefined") return () => {};
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastRun = Date.now();
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    lastRun = Date.now();
    try {
      await run();
    } catch {
      // a failed poll waits for the next one
    } finally {
      running = false;
    }
  };
  const start = () => {
    if (timer === null) timer = setInterval(() => void tick(), intervalMs);
  };
  const pause = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      if (Date.now() - lastRun >= intervalMs) void tick();
      start();
    } else {
      pause();
    }
  };

  if (document.visibilityState === "visible") start();
  document.addEventListener("visibilitychange", onVisibilityChange);
  return () => {
    pause();
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}

/** {@link visibleInterval} as a hook; the latest `callback` is always the one run. */
export function useVisibleInterval(callback: () => unknown, intervalMs: number) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  });
  useEffect(() => visibleInterval(() => saved.current(), intervalMs), [intervalMs]);
}
