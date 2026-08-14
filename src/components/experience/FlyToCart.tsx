"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useFlyToCart } from "@/context/FlyToCartContext";
import { useReducedMotion } from "@/hooks/useMotionPrefs";
import { EASE } from "@/lib/motion";

export function FlyToCart() {
  const { fly, toast, clearFly } = useFlyToCart();
  const reduced = useReducedMotion();
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!fly) return;
    const cartEl = document.querySelector("[data-cart-icon]");
    const rect = cartEl?.getBoundingClientRect();
    const nextTarget = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : null;
    const frame = requestAnimationFrame(() => {
      if (nextTarget) setTarget(nextTarget);
    });
    const timer = setTimeout(clearFly, reduced ? 0 : 650);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [fly, clearFly, reduced]);

  if (reduced) return null;

  return (
    <>
      <AnimatePresence>
        {fly && target && (
          <motion.div
            key={fly.id}
            initial={{
              x: fly.from.left + fly.from.width / 2,
              y: fly.from.top + fly.from.height / 2,
              scale: 1,
              opacity: 1,
            }}
            animate={{
              x: target.x,
              y: target.y,
              scale: 0.15,
              opacity: 0.6,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.55, ease: EASE.premium }}
            className="fixed top-0 left-0 z-[80] pointer-events-none w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-md overflow-hidden shadow-elevated border border-border"
          >
            <Image src={fly.image} alt="" fill className="object-cover" sizes="64px" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 8, x: "-50%" }}
            transition={{ duration: 0.3, ease: EASE.premium }}
            className="fixed bottom-6 left-1/2 z-[80] glass px-5 py-2.5 rounded-full text-xs tracking-[0.2em] font-mono"
          >
            ADDED TO CART ✓
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
