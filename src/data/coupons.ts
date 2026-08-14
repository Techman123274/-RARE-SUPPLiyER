import type { Coupon } from "@/lib/types";

export const defaultCoupons: Coupon[] = [
  {
    id: "welcome10",
    code: "WELCOME10",
    title: "Welcome Drop",
    description: "10% off your first order over $50",
    type: "percent",
    value: 10,
    minOrder: 50,
    expiresAt: "2026-12-31T23:59:59Z",
    active: true,
    badge: "NEW",
  },
  {
    id: "rare20",
    code: "RARE20",
    title: "Rare Find",
    description: "$20 off orders over $150",
    type: "fixed",
    value: 20,
    minOrder: 150,
    expiresAt: "2026-09-30T23:59:59Z",
    active: true,
    badge: "HOT",
  },
  {
    id: "vip15",
    code: "VIP15",
    title: "VIP Access",
    description: "15% off — limited codes",
    type: "percent",
    value: 15,
    minOrder: 100,
    expiresAt: "2026-08-31T23:59:59Z",
    active: true,
    badge: "LIMITED",
  },
  {
    id: "freeship",
    code: "FREESHIP",
    title: "Free Shipping",
    description: "Free shipping on orders over $200",
    type: "free_shipping",
    value: 0,
    minOrder: 200,
    active: true,
    badge: "RESTOCK",
  },
];

export function calculateCouponDiscount(
  coupon: Coupon,
  subtotal: number,
  shipping: number
): number {
  if (!coupon.active) return 0;
  if (coupon.minOrder && subtotal < coupon.minOrder) return 0;
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return 0;

  if (coupon.type === "free_shipping" || coupon.discountType === "free_shipping" || coupon.code === "FREESHIP") {
    return shipping;
  }

  if (coupon.type === "percent") {
    return Math.round(subtotal * (coupon.value / 100));
  }
  return Math.min(coupon.value, subtotal);
}
