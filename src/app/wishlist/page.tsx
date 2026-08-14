"use client";

import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { ProductGrid } from "@/components/products/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export default function WishlistPage() {
  const { wishlistProducts } = useWishlist();

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <FadeIn>
        <p className="text-[10px] tracking-[0.32em] text-muted font-mono mb-2">
          SAVED
        </p>
        <h1 className="text-3xl sm:text-5xl font-display tracking-[0.08em] mb-8">
          WISHLIST
        </h1>
      </FadeIn>

      {wishlistProducts.length === 0 ? (
        <EmptyState
          title="NO SAVED ITEMS"
          description="Tap the heart on any product to save it here."
          action={
            <Link href="/shop">
              <Button variant="secondary">BROWSE INVENTORY</Button>
            </Link>
          }
        />
      ) : (
        <ProductGrid products={wishlistProducts} />
      )}
    </div>
  );
}
