import { FadeIn } from "@/components/ui/FadeIn";
import Link from "next/link";

interface InfoPageProps {
  title: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}

export function InfoPage({
  title,
  children,
  backHref = "/",
  backLabel = "← Back",
}: InfoPageProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <FadeIn>
        <Link
          href={backHref}
          className="text-xs text-muted hover:text-foreground transition-colors tracking-wider mb-6 inline-block"
        >
          {backLabel}
        </Link>
        <h1 className="text-3xl font-display tracking-[0.08em] mb-6">{title}</h1>
        <div className="text-muted leading-relaxed space-y-4">{children}</div>
      </FadeIn>
    </div>
  );
}
