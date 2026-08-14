import { FadeIn } from "@/components/ui/FadeIn";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ABOUT, SITE } from "@/content/site";

export const metadata = {
  title: `About — ${SITE.name}`,
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <FadeIn>
        <p className="text-[10px] tracking-[0.32em] text-muted font-mono mb-6">{ABOUT.kicker}</p>
        <div className="mb-8">
          <Logo variant="footer" linked={false} />
        </div>
      </FadeIn>

      <FadeIn delay={0.08}>
        <p className="text-[10px] tracking-[0.32em] text-muted font-mono mb-4">
          {SITE.tagline}
        </p>
        <h1 className="text-3xl sm:text-5xl font-display tracking-[0.08em] mb-10">
          {ABOUT.headline}
        </h1>
      </FadeIn>

      <div className="space-y-6 text-muted leading-relaxed">
        {ABOUT.paragraphs.map((paragraph, i) => (
          <FadeIn key={paragraph} delay={0.12 + i * 0.04}>
            <p>{paragraph}</p>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.28}>
        <div className="mt-12">
          <Link href="/shop">
            <Button>{SITE.ctaPrimary}</Button>
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
