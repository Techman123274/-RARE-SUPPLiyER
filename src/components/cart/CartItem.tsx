"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItemWithProduct } from "@/lib/types";
import { formatPrice, productHref } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface CartItemRowProps {
  item: CartItemWithProduct;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-4 py-4 border-b border-border">
      <Link
        href={productHref(item.product)}
        className="relative w-20 h-20 flex-shrink-0 overflow-hidden studio-well border border-border"
      >
        <SafeImage src={item.product.images[0]} alt={item.product.name} fill className="object-contain p-1.5" sizes="80px" />
      </Link>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] tracking-[0.16em] text-muted uppercase">{item.product.brand}</p>
        <Link
          href={productHref(item.product)}
          className="text-sm font-medium hover:text-accent-secondary transition-colors line-clamp-1"
        >
          {item.product.name}
        </Link>
        <p className="text-xs text-muted mt-1">Size {item.size}</p>
        <p className="text-sm font-mono mt-1">
          {formatPrice(item.product.price)}
        </p>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-border">
            <button
              onClick={() =>
                updateQuantity(item.productId, item.size, item.quantity - 1)
              }
              className="p-1.5 hover:bg-surface-elevated transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-3 text-xs font-mono">{item.quantity}</span>
            <button
              onClick={() =>
                updateQuantity(item.productId, item.size, item.quantity + 1)
              }
              className="p-1.5 hover:bg-surface-elevated transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => removeItem(item.productId, item.size)}
            className="p-1.5 text-muted hover:text-red-400 transition-colors"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
