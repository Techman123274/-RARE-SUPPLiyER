"use client";

import { useState } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { createPendingOrder } from "@/app/admin/actions";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import type { CheckoutFormData } from "@/lib/types";

const initialForm: CheckoutFormData = {
  email: "",
  firstName: "",
  lastName: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
};

export default function CheckoutPage() {
  const { items, subtotal, shipping, discount, total, appliedCoupon, clearCart } = useCart();
  const [form, setForm] = useState<CheckoutFormData>(initialForm);
  const [placed, setPlaced] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof CheckoutFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);
    setSubmitting(true);
    const result = await createPendingOrder({
      email: form.email,
      items: items.map((item) => ({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
      })),
      couponCode: appliedCoupon?.code,
      shippingAddress: {
        firstName: form.firstName,
        lastName: form.lastName,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        country: form.country,
        phone: form.phone ?? "",
      },
    });
    setSubmitting(false);
    if (!result.ok) {
      setOrderError(result.error);
      return;
    }
    clearCart();
    setPlaced(true);
  };

  if (items.length === 0 && !placed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-display mb-4">Your cart is empty</h1>
        <p className="text-muted mb-6">Add items before checking out.</p>
        <Link href="/shop">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <FadeIn>
          <h1 className="text-2xl font-display mb-3">Order received</h1>
          <p className="text-muted text-sm max-w-md mx-auto mb-6">
            A pending order was created with server-side prices. Payment is not connected yet — nothing was charged and inventory was not reduced.
          </p>
            <div className="glass p-6 border border-dashed border-border mb-8">
            <p className="text-sm font-mono tracking-wider text-muted">
              PAYMENT INTEGRATION COMING SOON
            </p>
          </div>
          <Link href="/shop">
            <Button>BACK TO SHOP</Button>
          </Link>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <FadeIn>
        <h1 className="text-3xl font-display tracking-[0.08em] mb-8">CHECKOUT</h1>
      </FadeIn>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <FadeIn className="space-y-8">
          {/* Customer Info */}
          <section>
            <h2 className="text-xs tracking-[0.2em] font-medium mb-4">
              CUSTOMER INFORMATION
            </h2>
            <div className="space-y-3">
              <input
                type="email"
                required
                placeholder="Email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="field-input"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  className="field-input"
                />
                <input
                  type="text"
                  required
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  className="field-input"
                />
              </div>
              <input
                type="tel"
                placeholder="Phone"
                value={form.phone ?? ""}
                onChange={(e) => update("phone", e.target.value)}
                className="field-input"
              />
            </div>
          </section>

          {/* Shipping */}
          <section>
            <h2 className="text-xs tracking-[0.2em] font-medium mb-4">
              SHIPPING INFORMATION
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                required
                placeholder="Address"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                className="field-input"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="field-input"
                />
                <input
                  type="text"
                  required
                  placeholder="State"
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  className="field-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="ZIP Code"
                  value={form.zip}
                  onChange={(e) => update("zip", e.target.value)}
                  className="field-input"
                />
                <input
                  type="text"
                  required
                  placeholder="Country"
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  className="field-input"
                />
              </div>
            </div>
          </section>

          {/* Payment placeholder */}
          <section>
            <h2 className="text-xs tracking-[0.2em] font-medium mb-4">
              PAYMENT
            </h2>
            <div className="glass p-6 text-center border border-dashed border-border">
              <p className="text-sm font-mono tracking-wider text-muted">
                PAYMENT INTEGRATION COMING SOON
              </p>
              <p className="text-xs text-muted/60 mt-2">
                Stripe / PayPal / Shopify will connect here
              </p>
            </div>
          </section>
        </FadeIn>

        {/* Order Summary */}
        <FadeIn delay={0.1}>
          <div className="glass p-6 h-fit sticky top-20">
            <h2 className="text-xs tracking-[0.2em] font-medium mb-6">
              ORDER SUMMARY
            </h2>

            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="flex gap-3"
                >
                  <div className="relative w-14 h-14 rounded-md overflow-hidden bg-surface-elevated flex-shrink-0">
                    <SafeImage
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-muted">
                      Size {item.size} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-mono flex-shrink-0">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm border-t border-border pt-4 mb-6">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-mono">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Shipping</span>
                <span className="font-mono">{formatPrice(shipping)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount{appliedCoupon ? ` (${appliedCoupon.code})` : ""}</span>
                  <span className="font-mono">−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border font-medium text-base">
                <span>Total</span>
                <span className="font-mono">{formatPrice(total)}</span>
              </div>
            </div>

            {orderError && <p className="text-sm text-red-400">{orderError}</p>}
            <Button type="submit" size="lg" className="w-full" loading={submitting}>
              PLACE PENDING ORDER
            </Button>
            <p className="text-[10px] text-muted text-center mt-3">
              Prices are calculated on the server. Payment is not connected yet — nothing is charged and stock is not reduced.
            </p>
            <Link href="/shop">
              <Button variant="ghost" className="w-full mt-3">CONTINUE SHOPPING</Button>
            </Link>
          </div>
        </FadeIn>
      </form>
    </div>
  );
}
