"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice, productHref, getUniqueSizes } from "@/lib/utils";
import { formatAvailability } from "@/lib/product-utils";
import { SafeImage } from "@/components/ui/SafeImage";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useCart } from "@/context/CartContext";
import { useFlyToCart } from "@/context/FlyToCartContext";
import { cn } from "@/lib/utils";

interface QuickViewProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickView({ product, isOpen, onClose }: QuickViewProps) {
  const { addItem, openCart } = useCart();
  const { triggerFly } = useFlyToCart();
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.availableSizes.length === 1 ? product.availableSizes[0] : null
  );
  const soldOut = product.availableSizes.length === 0 || product.stock <= 0;
  const sizes = getUniqueSizes(product.sizes.length ? product.sizes : product.availableSizes);
  const sizeLabel =
    product.availableSizes.length === 1
      ? product.availableSizes[0]
      : product.availableSizes.length > 1
        ? `${product.availableSizes.length} sizes`
        : "—";

  const handleAdd = () => {
    if (soldOut) return;
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    const success = addItem(product.id, selectedSize);
    if (success) {
      const el = document.querySelector("[data-quick-view-image]");
      if (el) {
        triggerFly({
          image: product.images[0],
          from: el.getBoundingClientRect(),
        });
      }
      setAdded(true);
      setTimeout(() => {
        onClose();
        openCart();
      }, 400);
      setTimeout(() => setAdded(false), 1600);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QUICK VIEW">
      <div className="grid sm:grid-cols-[0.9fr_1.1fr] gap-5">
        <div
          data-quick-view-image
          className="relative aspect-square studio-well border border-border overflow-hidden"
        >
          <SafeImage
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain p-5"
            sizes="320px"
          />
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] tracking-[0.24em] text-muted uppercase mb-1">
              {product.brand}
            </p>
            <h3 className="text-xl font-display tracking-[0.06em] mb-2">{product.name}</h3>
            <p className="font-mono text-lg">{formatPrice(product.price)}</p>
          </div>

          <div className="space-y-1.5 text-xs tracking-[0.12em] text-muted">
            <p>
              SIZE <span className="text-foreground">{sizeLabel}</span>
            </p>
            <p>
              CONDITION <span className="text-foreground">{product.condition.toUpperCase()}</span>
            </p>
            <p>
              AVAILABILITY{" "}
              <span className="text-foreground">{formatAvailability(product).toUpperCase()}</span>
            </p>
          </div>

          {!soldOut && sizes.length > 1 && (
            <div>
              <p className="text-[10px] tracking-[0.2em] text-muted mb-2">SELECT SIZE</p>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((size) => {
                  const available = product.availableSizes.includes(size);
                  return (
                    <button
                      key={size}
                      disabled={!available}
                      onClick={() => {
                        setSelectedSize(size);
                        setSizeError(false);
                      }}
                      className={cn(
                        "min-w-[40px] h-9 px-2 text-xs font-mono border transition-colors",
                        selectedSize === size
                          ? "border-accent-secondary text-accent-secondary"
                          : available
                            ? "border-border hover:border-foreground"
                            : "border-border/30 text-muted/40 line-through cursor-not-allowed"
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              {sizeError && <p className="text-xs text-red-400 mt-2">Select a size</p>}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Link href={productHref(product)} onClick={onClose}>
              <Button className="w-full" variant="secondary">
                VIEW PRODUCT
              </Button>
            </Link>
            <Button className="w-full" onClick={handleAdd} disabled={soldOut} success={added}>
              {soldOut ? "SOLD" : "ADD TO BAG"}
            </Button>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 py-2 text-[10px] tracking-[0.2em] text-muted hover:text-foreground"
            >
              <X className="w-3 h-3" />
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
