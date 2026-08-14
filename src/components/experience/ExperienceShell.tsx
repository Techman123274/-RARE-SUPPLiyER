"use client";

import { FlyToCart } from "./FlyToCart";
import { CustomCursor } from "./CustomCursor";
import { MobileCartBar } from "./MobileCartBar";

export function ExperienceShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CustomCursor />
      <FlyToCart />
      {children}
      <MobileCartBar />
    </>
  );
}
