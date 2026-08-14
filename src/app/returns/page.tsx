import { InfoPage } from "@/components/layout/InfoPage";

export const metadata = { title: "Returns — RARE SUPPLiyER" };

export default function ReturnsPage() {
  return (
    <InfoPage title="Returns" backHref="/shop" backLabel="← Back to Shop">
      <p>
        We accept returns within 14 days of delivery for unworn items in original
        condition.
      </p>
      <p>
        Contact us to initiate a return. Buyer is responsible for return shipping
        unless the item was misrepresented.
      </p>
      <p>
        Refunds are processed within 5–7 business days after we receive and inspect
        the return.
      </p>
      <p className="text-xs text-muted/60 pt-4">
        Update this page with your real return policy before launch.
      </p>
    </InfoPage>
  );
}
