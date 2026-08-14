"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { SITE } from "@/content/site";
import { useReducedMotion } from "@/hooks/useMotionPrefs";
import { DURATION, EASE } from "@/lib/motion";

const PARTICLES = [
  { top: "22%", left: "14%", delay: "0s" },
  { top: "28%", left: "82%", delay: "1.2s" },
  { top: "68%", left: "18%", delay: "2.1s" },
  { top: "62%", left: "78%", delay: "0.6s" },
  { top: "40%", left: "90%", delay: "1.8s" },
  { top: "76%", left: "48%", delay: "2.6s" },
];

export function StoreHero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden -mt-14 pt-14">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_38%,rgba(61,158,255,0.1),transparent_62%)]" />
        <div className="absolute inset-0 hero-grid opacity-70" />
        <div className="absolute inset-0 film-grain opacity-25" />
        <motion.div
          className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-accent-secondary/10 blur-3xl"
          animate={reduced ? undefined : { opacity: [0.22, 0.4, 0.22], scale: [1, 1.06, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        {!reduced && (
          <div className="hero-particles absolute inset-0">
            {PARTICLES.map((p, i) => (
              <span key={i} style={{ top: p.top, left: p.left, animationDelay: p.delay }} />
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 text-center py-16 sm:py-20">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: DURATION.slow, ease: EASE.premium }}
          className="mx-auto mb-5"
        >
          <Logo variant="hero" linked={false} className="mx-auto max-w-[min(72vw,300px)]" />
        </motion.div>

        <h1 className="sr-only">{SITE.name}</h1>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: DURATION.normal, ease: EASE.premium }}
          className="text-[10px] tracking-[0.42em] text-muted font-mono mb-6"
        >
          ONLINE RESALE STORE
        </motion.p>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: DURATION.normal, ease: EASE.premium }}
          className="font-display text-3xl sm:text-5xl tracking-[0.08em] leading-tight mb-4"
        >
          RARE FINDS.
          <br />
          REAL CONDITION.
        </motion.p>

        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: DURATION.normal }}
          className="text-sm sm:text-base text-muted max-w-md mx-auto mb-8 leading-relaxed"
        >
          Premium sneakers, clothing and accessories sourced for resale.
        </motion.p>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: DURATION.normal, ease: EASE.premium }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
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
    </section>
  );
}
