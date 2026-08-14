import { Suspense } from "react";
import { ShopContent } from "@/components/shop/ShopContent";

export const metadata = {
  title: "Shop — RARE SUPPLiyER",
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="max-w-[1440px] mx-auto px-4 py-20 text-center text-[10px] tracking-[0.28em] text-muted font-mono">LOADING INVENTORY</div>}>
      <ShopContent />
    </Suspense>
  );
}
