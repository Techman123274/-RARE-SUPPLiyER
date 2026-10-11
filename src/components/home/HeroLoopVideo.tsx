"use client";

import { useEffect, useRef } from "react";
import { Logo } from "@/components/ui/Logo";
import { useReducedMotion } from "@/hooks/useMotionPrefs";
import { cn } from "@/lib/utils";

const SRC = "/assets/brand/hero-loop.mp4";
const FADE_MS = 280;
const LOOP_IN = 0.03;

export function HeroLoopVideo({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (reduced) return;
    const a = aRef.current;
    const b = bRef.current;
    if (!a || !b) return;

    const videos = [a, b];
    let front = 0;
    let fading = false;
    let raf = 0;
    let fadeTimer = 0;

    const applyLayer = (el: HTMLVideoElement, shown: boolean) => {
      el.style.opacity = shown ? "1" : "0";
    };

    videos.forEach((el, i) => {
      el.muted = true;
      el.defaultMuted = true;
      el.playsInline = true;
      el.setAttribute("playsinline", "");
      el.setAttribute("webkit-playsinline", "");
      el.preload = "auto";
      el.style.transition = `opacity ${FADE_MS}ms ease-in-out`;
      applyLayer(el, i === 0);
    });

    const playSafe = (el: HTMLVideoElement) => {
      el.muted = true;
      void el.play().catch(() => {});
    };

    const tick = () => {
      const current = videos[front];
      const duration = current.duration;
      if (!fading && duration && Number.isFinite(duration) && duration > 1) {
        if (current.currentTime >= duration - FADE_MS / 1000) {
          fading = true;
          const next = 1 - front;
          const incoming = videos[next];
          incoming.currentTime = LOOP_IN;
          playSafe(incoming);
          applyLayer(incoming, true);
          applyLayer(current, false);
          fadeTimer = window.setTimeout(() => {
            current.pause();
            current.currentTime = LOOP_IN;
            front = next;
            fading = false;
          }, FADE_MS);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => playSafe(videos[0]);
    videos[0].addEventListener("canplay", start);
    start();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fadeTimer);
      videos[0].removeEventListener("canplay", start);
      videos.forEach((el) => el.pause());
    };
  }, [reduced]);

  if (reduced) {
    return (
      <div className={cn("relative mx-auto flex h-full w-full items-start justify-center pt-1", className)}>
        <Logo variant="hero" linked={false} className="max-h-full w-auto max-w-full h-auto" />
      </div>
    );
  }

  return (
    <div className={cn("relative mx-auto h-full w-full max-w-full", className)}>
      <video
        ref={aRef}
        src={SRC}
        muted
        playsInline
        autoPlay
        preload="auto"
        disablePictureInPicture
        aria-hidden
        tabIndex={-1}
        // object-top keeps the light streak / top of RARE under the nav when the
        // flex slot is taller than the video (mobile letterboxing).
        className="absolute inset-0 h-full w-full object-contain object-top pointer-events-none select-none"
      />
      <video
        ref={bRef}
        src={SRC}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-hidden
        tabIndex={-1}
        className="absolute inset-0 h-full w-full object-contain object-top pointer-events-none select-none opacity-0"
      />
    </div>
  );
}
