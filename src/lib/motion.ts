export const EASE = {
  premium: [0.22, 1, 0.36, 1] as const,
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
};

export const DURATION = {
  instant: 0.12,
  fast: 0.22,
  normal: 0.4,
  slow: 0.65,
  cinematic: 0.9,
};

export const STAGGER = 0.07;

export const MOTION = {
  page: {
    initial: { opacity: 0, y: 10, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: DURATION.normal, ease: EASE.premium },
  },
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DURATION.normal, ease: EASE.premium },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: DURATION.fast, ease: EASE.premium },
  },
  card: {
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DURATION.normal, ease: EASE.premium },
  },
  nav: {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DURATION.slow, ease: EASE.premium },
  },
  modal: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: DURATION.fast, ease: EASE.premium },
  },
  drawer: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
    transition: { duration: DURATION.normal, ease: EASE.premium },
  },
} as const;

export const INTRO_SESSION_KEY = "rare-suppliyer-loaded";
