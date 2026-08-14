import { ProductPageClient } from "@/components/products/ProductPageClient";
import { ProductReviewsSection } from "@/components/reviews/ProductReviewsSection";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params;
  return { title: `${id.replace(/-/g, " ")} — RARE SUPPLiyER` };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  return (
    <>
      <ProductPageClient id={id} />
      <ProductReviewsSection productKey={id} />
    </>
  );
}
