import { FadeIn } from "@/components/ui/FadeIn";

const points = [
  { title: "REAL INVENTORY", copy: "What you see is what is currently listed." },
  { title: "REAL SIZES", copy: "Available sizes are shown on every item." },
  { title: "REAL CONDITION", copy: "Condition notes come with the listing." },
  { title: "CURRENT STOCK", copy: "Pieces leave the floor as they sell." },
];

export function WhyRare() {
  return (
    <section className="py-14 sm:py-16 border-t border-border">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="text-[10px] tracking-[0.32em] text-muted font-mono mb-8">
            WHY RARE SUPPLiyER
          </p>
        </FadeIn>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {points.map((point, i) => (
            <FadeIn key={point.title} delay={i * 0.04}>
              <div className="bg-background px-5 py-7 sm:px-6 sm:py-8 h-full">
                <h3 className="text-xs tracking-[0.2em] font-display mb-2">{point.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{point.copy}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
