"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { CartItemRow } from "@/components/cart/CartItem";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FadeIn } from "@/components/ui/FadeIn";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const {
    items, itemCount, subtotal, shipping, discount, total,
    appliedCoupon, applyCoupon, removeCoupon,
  } = useCart();
  const [code, setCode] = useState("");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <FadeIn>
        <p className="text-[10px] tracking-[0.32em] text-muted font-mono mb-2">ORDER</p>
        <h1 className="text-3xl sm:text-5xl font-display tracking-[0.08em] mb-8">
          BAG ({itemCount})
        </h1>
      </FadeIn>

      {items.length === 0 ? (
        <EmptyState
          title="YOUR BAG IS EMPTY"
          description="Browse the shop and add something from current inventory."
          action={
            <Link href="/shop">
              <Button variant="secondary">BROWSE INVENTORY</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
          <FadeIn>
            <div className="glass p-4 sm:p-6">
              {items.map((item) => (
                <CartItemRow key={`${item.productId}-${item.size}`} item={item} />
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.08}>
            <div className="glass p-6 space-y-4 lg:sticky lg:top-20">
              <h2 className="text-[10px] tracking-[0.22em] text-muted mb-2">ORDER SUMMARY</h2>
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="field-input py-2.5 text-sm font-mono"
                  />
                  <Button variant="secondary" onClick={() => applyCoupon(code)}>APPLY</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-400">{appliedCoupon.code} — {appliedCoupon.title}</span>
                  <button onClick={removeCoupon} className="text-xs text-muted hover:text-foreground">Remove</button>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-mono">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Shipping (est.)</span>
                  <span className="font-mono">{formatPrice(shipping)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Discount</span>
                    <span className="font-mono">−{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-border font-medium">
                  <span>Total</span>
                  <span className="font-mono">{formatPrice(total)}</span>
                </div>
              </div>

              <Link href="/checkout">
                <Button size="lg" className="w-full">CHECKOUT</Button>
              </Link>
              <Link href="/shop" className="block text-center text-[10px] tracking-[0.2em] text-muted hover:text-foreground">
                CONTINUE SHOPPING
              </Link>
            </div>
          </FadeIn>
        </div>
      )}
    </div>
  );
}
