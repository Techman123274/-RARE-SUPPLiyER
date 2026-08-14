"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  success?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-foreground text-background hover:bg-foreground/90 btn-shimmer",
  secondary:
    "bg-transparent text-foreground border border-border hover:border-accent-secondary/50 hover:text-accent-secondary",
  ghost:
    "bg-transparent text-foreground hover:bg-surface-elevated hover:text-accent-secondary",
  outline:
    "bg-transparent text-foreground border border-border hover:border-foreground/30",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[10px] tracking-[0.18em]",
  md: "px-5 py-2.5 text-xs tracking-[0.18em]",
  lg: "px-7 py-3.5 text-xs tracking-[0.22em]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      success,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "btn-press inline-flex items-center justify-center gap-2 font-medium uppercase duration-300 ease-premium rounded-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          variants[variant],
          sizes[size],
          success && "bg-emerald-600 text-white",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children}
          </>
        ) : success ? (
          "ADDED TO BAG"
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
