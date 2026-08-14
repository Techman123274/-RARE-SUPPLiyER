import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  products: Product[];
  variant?: "default" | "large";
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  variant = "default",
  emptyMessage = "NO INVENTORY FOUND",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        description="Try adjusting your filters or browse all available inventory."
        action={
          <Link href="/shop">
            <Button variant="secondary">BROWSE INVENTORY</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div
      className={cn(
        variant === "large"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
          : "grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 min-[1600px]:grid-cols-5 gap-3 sm:gap-4"
      )}
    >
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          index={i}
          variant={variant}
        />
      ))}
    </div>
  );
}
