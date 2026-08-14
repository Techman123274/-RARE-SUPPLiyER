"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useIsDesktop, useReducedMotion } from "@/hooks/useMotionPrefs";

type CursorMode = "default" | "view" | "explore" | "cta";

export function CustomCursor() {
  const desktop = useIsDesktop();
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<CursorMode>("default");
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 400, damping: 35 });
  const springY = useSpring(y, { stiffness: 400, damping: 35 });

  useEffect(() => {
    if (!desktop || reduced) return;

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      document.body.classList.add("custom-cursor-active");
    };

    const over = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable='true']")) {
        setVisible(false);
        document.body.classList.remove("custom-cursor-active");
        return;
      }
      const cursorEl = target.closest("[data-cursor]") as HTMLElement | null;
      const modeAttr = cursorEl?.dataset.cursor as CursorMode | undefined;
      setMode(modeAttr ?? "default");
    };

    const leave = () => {
      setVisible(false);
      document.body.classList.remove("custom-cursor-active");
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mouseleave", leave);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mouseleave", leave);
      document.body.classList.remove("custom-cursor-active");
    };
  }, [desktop, reduced, x, y]);

  if (!desktop || reduced || !visible) return null;

  const label =
    mode === "view" ? "VIEW" : mode === "explore" ? "EXPLORE" : mode === "cta" ? "" : "";

  const size = mode === "cta" ? 56 : mode === "default" ? 12 : 48;

  return (
    <motion.div
      className="fixed top-0 left-0 z-[90] pointer-events-none mix-blend-difference"
      style={{ x: springX, y: springY, translateX: "-50%", translateY: "-50%" }}
      initial={{ opacity: 0, width: size, height: size }}
      animate={{ opacity: 1, width: size, height: size }}
      transition={{ duration: 0.15 }}
    >
      <div
        className={`w-full h-full rounded-full border border-white/80 flex items-center justify-center ${
          mode === "default" ? "bg-white/90" : "bg-white/10 backdrop-blur-sm"
        }`}
      >
        {label && (
          <span className="text-[9px] tracking-[0.2em] text-white font-mono">{label}</span>
        )}
      </div>
    </motion.div>
  );
}
