"use client";

import { useSyncExternalStore } from "react";

function subscribeMatchMedia(query: string, onChange: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useMatchMedia(query: string, serverValue = false) {
  return useSyncExternalStore(
    (onChange) => subscribeMatchMedia(query, onChange),
    () => window.matchMedia(query).matches,
    () => serverValue
  );
}

export function useReducedMotion() {
  return useMatchMedia("(prefers-reduced-motion: reduce)");
}

export function useIsDesktop() {
  return useMatchMedia("(min-width: 1024px)");
}
