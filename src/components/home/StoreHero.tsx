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
    <section className="relative flex min-h-[calc(100svh-3.5rem)] flex-col overflow-hidden bg-black">
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pt-2 pb-6 sm:px-6 sm:pt-3 sm:pb-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: DURATION.slow, ease: EASE.premium }}
          className="relative min-h-0 w-full flex-[1.35]"
        >
          {/* Absolute fill: videos are out-of-flow, so a plain h-full child collapses. */}
          <div className="absolute inset-0">
            <HeroLoopVideo />
          </div>
        </motion.div>

        <div className="w-full shrink-0 pt-3 text-center sm:pt-4">
          <h1 className="sr-only">{SITE.name}</h1>

          <motion.p
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: DURATION.normal, ease: EASE.premium }}
            className="mb-2 font-mono text-[10px] tracking-[0.42em] text-muted sm:mb-3"
          >
            ONLINE RESALE STORE
          </motion.p>

          <motion.p
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: DURATION.normal, ease: EASE.premium }}
            className="mb-3 font-display text-2xl leading-tight tracking-[0.08em] sm:mb-4 sm:text-4xl lg:text-5xl"
          >
            RARE FINDS.
            <br />
            REAL CONDITION.
          </motion.p>

          <motion.p
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: DURATION.normal }}
            className="mx-auto mb-4 hidden max-w-md text-sm leading-relaxed text-muted [@media(min-height:760px)]:block sm:mb-5 sm:text-base"
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
