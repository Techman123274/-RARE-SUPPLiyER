"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { CartItemRow } from "./CartItem";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const {
    items, itemCount, subtotal, shipping, discount, total,
    appliedCoupon, applyCoupon, removeCoupon, isOpen, closeCart,
  } = useCart();
  const [code, setCode] = useState("");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={closeCart}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md glass-strong flex flex-col shadow-elevated"
            role="dialog"
            aria-label="Shopping bag"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-xs tracking-[0.22em] font-display">BAG ({itemCount})</h2>
              <button onClick={closeCart} className="p-2 hover:bg-surface-elevated min-h-11 min-w-11" aria-label="Close bag">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5">
              {items.length === 0 ? (
                <EmptyState
                  title="YOUR BAG IS EMPTY"
                  description="Browse current inventory and add something in stock."
                  action={
                    <Link href="/shop" onClick={closeCart}>
                      <Button variant="secondary">BROWSE INVENTORY</Button>
                    </Link>
                  }
                />
              ) : (
                items.map((item) => (
                  <CartItemRow key={`${item.productId}-${item.size}`} item={item} />
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-5 border-t border-border space-y-4">
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      className="field-input py-2 text-xs font-mono"
                    />
                    <Button size="sm" variant="secondary" onClick={() => applyCoupon(code)}>APPLY</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400">{appliedCoupon.code} applied</span>
                    <button onClick={removeCoupon} className="text-muted hover:text-foreground">Remove</button>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-mono">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Shipping (est.)</span>
                    <span className="font-mono">{formatPrice(shipping)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount</span>
                      <span className="font-mono">−{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border font-medium">
                    <span>Total</span>
                    <span className="font-mono">{formatPrice(total)}</span>
                  </div>
                </div>

                <Link href="/checkout" onClick={closeCart}>
                  <Button className="w-full" size="lg">CHECKOUT</Button>
                </Link>
                <button
                  onClick={closeCart}
                  className="block w-full text-center text-[10px] tracking-[0.2em] text-muted hover:text-foreground"
                >
                  CONTINUE SHOPPING
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
