import { InfoPage } from "@/components/layout/InfoPage";

export const metadata = { title: "Terms — RARE SUPPLiyER" };

export default function TermsPage() {
  return (
    <InfoPage title="Terms of Service">
      <p>
        By using RARE SUPPLiyER, you agree to these terms. This is placeholder
        content pending legal review.
      </p>
      <p>
        All items are sold as described. We authenticate products to the best of our
        ability but recommend independent verification for high-value purchases.
      </p>
      <p>Prices and availability are subject to change without notice.</p>
      <p className="text-xs text-muted/60 pt-4">
        Consult legal counsel before launch.
      </p>
    </InfoPage>
  );
}
