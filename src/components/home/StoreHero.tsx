"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { HeroLoopVideo } from "./HeroLoopVideo";
import { SITE } from "@/content/site";
import { useReducedMotion } from "@/hooks/useMotionPrefs";
import { DURATION, EASE } from "@/lib/motion";

export function StoreHero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative h-[100svh] max-h-[100svh] overflow-hidden bg-black -mt-14 pt-14 pb-20 sm:pb-0">
      <div className="relative z-10 h-full w-full max-w-[1440px] mx-auto px-4 sm:px-6 flex flex-col items-center justify-center gap-4 sm:gap-5 py-4 sm:py-6">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: DURATION.slow, ease: EASE.premium }}
          className="flex-1 min-h-0 w-full flex items-center justify-center"
        >
          <HeroLoopVideo />
        </motion.div>

        <div className="shrink-0 w-full text-center">
          <h1 className="sr-only">{SITE.name}</h1>

          <motion.p
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: DURATION.normal, ease: EASE.premium }}
            className="text-[10px] tracking-[0.42em] text-muted font-mono mb-3 sm:mb-4"
          >
            ONLINE RESALE STORE
          </motion.p>

          <motion.p
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: DURATION.normal, ease: EASE.premium }}
            className="font-display text-2xl sm:text-4xl lg:text-5xl tracking-[0.08em] leading-tight mb-3 sm:mb-4"
          >
            RARE FINDS.
            <br />
            REAL CONDITION.
          </motion.p>

          <motion.p
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: DURATION.normal }}
            className="hidden [@media(min-height:760px)]:block text-sm sm:text-base text-muted max-w-md mx-auto mb-5 sm:mb-6 leading-relaxed"
          >
            Premium sneakers, clothing and accessories sourced for resale.
          </motion.p>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: DURATION.normal, ease: EASE.premium }}
            className="flex flex-row flex-wrap items-center justify-center gap-3"
          >
            <Link href="/shop">
              <Button size="lg">{SITE.ctaPrimary}</Button>
            </Link>
            <Link href="/request">
              <Button variant="secondary" size="lg">
                {SITE.ctaSecondary}
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
