"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function MobileCartBar() {
  const { itemCount, subtotal, openCart } = useCart();
  const pathname = usePathname();

  if (itemCount === 0) return null;
  if (
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/product")
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 p-3 sm:hidden">
      <div className="glass-strong px-4 py-3 flex items-center justify-between gap-3 shadow-elevated">
        <button onClick={openCart} className="flex items-center gap-2 text-sm min-h-11">
          <ShoppingBag className="w-4 h-4" />
          <span className="font-mono">{itemCount} · {formatPrice(subtotal)}</span>
        </button>
        <Link
          href="/checkout"
          className="text-[10px] tracking-[0.2em] font-medium bg-foreground text-background px-4 py-2.5 min-h-11 inline-flex items-center"
        >
          CHECKOUT
        </Link>
      </div>
    </div>
  );
}
