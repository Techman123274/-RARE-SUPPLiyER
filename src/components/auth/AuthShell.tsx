"use client";

import { Logo } from "@/components/ui/Logo";
import { FadeIn } from "@/components/ui/FadeIn";
import { SITE } from "@/content/site";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  kicker: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function AuthShell({ kicker, title, children, className }: AuthShellProps) {
  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <FadeIn>
        <div className="flex justify-center mb-8">
          <Logo variant="footer" linked />
        </div>
        <p className="text-[10px] tracking-[0.35em] text-muted font-mono mb-3 text-center">
          {kicker}
        </p>
        <h1 className="text-3xl sm:text-4xl font-display tracking-wide text-center mb-2">
          {title}
        </h1>
        <p className="text-center text-[10px] tracking-[0.28em] text-muted font-mono mb-8">
          {SITE.tagline}
        </p>
      </FadeIn>
      <FadeIn delay={0.08}>
        <div className={cn("glass p-6 sm:p-8", className)}>
          {children}
        </div>
      </FadeIn>
    </div>
  );
}

export function AuthMessage({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "error" | "success";
}) {
  return (
    <p
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "text-xs tracking-wider leading-relaxed",
        tone === "error" && "text-red-300",
        tone === "success" && "text-accent-secondary",
        tone === "muted" && "text-muted"
      )}
    >
      {children}
    </p>
  );
}

export function AuthField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] tracking-[0.22em] font-mono text-muted">{label}</span>
      {children}
    </label>
  );
}

export const authInputClass = "field-input";
