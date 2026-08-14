import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";
import { Button } from "@/components/ui/Button";

export function RequestCta() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="relative overflow-hidden border border-border bg-surface px-6 py-12 sm:px-12 sm:py-16 text-center">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(61,158,255,0.1),transparent_70%)]" />
            <div className="relative">
              <p className="text-[10px] tracking-[0.36em] text-accent-secondary font-mono mb-3">
                CAN&apos;T FIND IT?
              </p>
              <h2 className="text-3xl sm:text-5xl font-display tracking-[0.08em] mb-4">
                REQUEST AN ITEM
              </h2>
              <p className="text-sm text-muted max-w-md mx-auto mb-8">
                Tell RARE SUPPLiyER what you&apos;re looking for.
              </p>
              <Link href="/request">
                <Button size="lg">REQUEST AN ITEM</Button>
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
