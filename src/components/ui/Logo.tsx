import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/assets/logo.png";

/** Actual logo dimensions: 1024 × 682 */
const LOGO_ASPECT = 1024 / 682;

interface LogoProps {
  variant?: "hero" | "nav" | "footer";
  className?: string;
  linked?: boolean;
}

const variants = {
  hero: {
    width: 1024,
    height: 682,
    className: "w-full max-w-[min(78vw,340px)] h-auto",
  },
  nav: {
    width: 1024,
    height: 682,
    className: "h-8 sm:h-9 w-auto max-w-[128px] sm:max-w-[148px]",
  },
  footer: {
    width: 1024,
    height: 682,
    className: "h-12 sm:h-14 w-auto max-w-[180px]",
  },
};

export function Logo({ variant = "nav", className, linked = true }: LogoProps) {
  const config = variants[variant];

  const image = (
    <Image
      src={LOGO_SRC}
      alt="RARE SUPPLiyER"
      width={config.width}
      height={config.height}
      sizes={
        variant === "nav"
          ? "148px"
          : variant === "footer"
            ? "180px"
            : "340px"
      }
      className={cn(config.className, "object-contain", className)}
      priority={variant === "hero" || variant === "nav"}
    />
  );

  if (!linked) return image;

  return (
    <Link
      href="/"
      className="inline-flex flex-shrink-0 transition-opacity hover:opacity-90"
    >
      {image}
    </Link>
  );
}

/** Chrome text fallback for tight spaces (nav alternative) */
export function LogoText({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex-shrink-0 group", className)}>
      <span className="font-display text-base sm:text-lg tracking-[0.12em] chrome-text whitespace-nowrap">
        RARE SUPPLiyER
      </span>
    </Link>
  );
}

export { LOGO_SRC, LOGO_ASPECT };
