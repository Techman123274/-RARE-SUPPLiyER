"use client";

import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { ProductGrid } from "@/components/products/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function AccountWishlistPage() {
  const { wishlistProducts } = useWishlist();
  return (
    <div className="space-y-5">
      <div className="glass p-6 sm:p-8">
        <p className="text-[10px] tracking-[0.22em] font-mono text-muted mb-2">WISHLIST</p>
        <h2 className="text-2xl font-display tracking-[0.08em]">Saved items</h2>
      </div>
      {wishlistProducts.length === 0 ? (
        <EmptyState
          title="NO SAVED ITEMS"
          description="Save products from the shop to see them here."
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
