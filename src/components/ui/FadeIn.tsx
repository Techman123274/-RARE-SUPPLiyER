"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useMotionPrefs";
import { DURATION, EASE } from "@/lib/motion";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export function FadeIn({
  children,
  delay = 0,
  className,
  direction = "up",
}: FadeInProps) {
  const reduced = useReducedMotion();
  const offset = {
    up: { y: 18 },
    down: { y: -18 },
    left: { x: 18 },
    right: { x: -18 },
    none: {},
  };

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...offset[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-48px" }}
      transition={{ duration: DURATION.normal, delay, ease: EASE.premium }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
