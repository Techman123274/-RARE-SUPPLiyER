import { InfoPage } from "@/components/layout/InfoPage";

export const metadata = { title: "Shipping — RARE SUPPLiyER" };

export default function ShippingPage() {
  return (
    <InfoPage title="Shipping" backHref="/shop" backLabel="← Back to Shop">
      <p>Orders ship within 1–3 business days after purchase confirmation.</p>
      <p>Standard shipping: $12 (estimated). Express options coming soon.</p>
      <p>Tracking information will be sent via email once your order ships.</p>
      <p className="text-xs text-muted/60 pt-4">
        Update this page with your real shipping policy before launch.
      </p>
    </InfoPage>
  );
}
