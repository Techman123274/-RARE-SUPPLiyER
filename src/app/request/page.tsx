import { FadeIn } from "@/components/ui/FadeIn";
import { RequestForm } from "@/components/requests/RequestForm";

export const metadata = {
  title: "Request an Item — RARE SUPPLiyER",
};

export default function RequestPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <FadeIn>
        <p className="text-[10px] tracking-[0.36em] font-mono text-accent-secondary mb-3">
          CAN&apos;T FIND IT?
        </p>
        <h1 className="text-3xl sm:text-5xl font-display tracking-[0.08em] leading-tight mb-4">
          REQUEST AN ITEM
        </h1>
        <p className="text-muted mb-10 max-w-xl text-sm leading-relaxed">
          Tell RARE SUPPLiyER what you&apos;re looking for. This is not an order.
        </p>
      </FadeIn>
      <RequestForm />
    </div>
  );
}
