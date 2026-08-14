import { FadeIn } from "@/components/ui/FadeIn";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata = {
  title: "Contact — RARE SUPPLiyER",
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <FadeIn>
        <h1 className="text-3xl font-display tracking-[0.08em] mb-4">CONTACT</h1>
        <p className="text-muted mb-8">
          Questions about an order, authentication, or selling with us? Reach out.
        </p>
      </FadeIn>
      <ContactForm />
    </div>
  );
}
