"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartItem, CartItemWithProduct, Coupon } from "@/lib/types";
import { useCatalog, SHIPPING_COST } from "@/context/CatalogContext";
import { calculateCouponDiscount } from "@/data/coupons";
import { safeParseJSON } from "@/lib/storage";

const CART_STORAGE_KEY = "rare-suppliyer-cart";
const COUPON_STORAGE_KEY = "rare-suppliyer-coupon";

interface CartContextValue {
  items: CartItemWithProduct[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  appliedCoupon: Coupon | null;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (productId: string, size: string, quantity?: number) => boolean;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParseJSON<CartItem[]>(
    localStorage.getItem(CART_STORAGE_KEY),
    []
  );
  return Array.isArray(parsed) ? parsed : [];
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { products, coupons } = useCatalog();
  const [rawItems, setRawItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const items = loadCart();
    const code = localStorage.getItem(COUPON_STORAGE_KEY);
    const found = code ? coupons.find((c) => c.code === code) ?? null : null;
    const id = requestAnimationFrame(() => {
      setRawItems(items);
      if (found) setAppliedCoupon(found);
      setHydrated(true);
    });
    return () => cancelAnimationFrame(id);
  }, [coupons]);

  useEffect(() => {
    if (hydrated) saveCart(rawItems);
  }, [rawItems, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (appliedCoupon) {
      localStorage.setItem(COUPON_STORAGE_KEY, appliedCoupon.code);
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }, [appliedCoupon, hydrated]);

  const items: CartItemWithProduct[] = useMemo(() => {
    return rawItems
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        return { ...item, product };
      })
      .filter(Boolean) as CartItemWithProduct[];
  }, [rawItems, products]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  const shipping = items.length > 0 ? SHIPPING_COST : 0;

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return calculateCouponDiscount(appliedCoupon, subtotal, shipping);
  }, [appliedCoupon, subtotal, shipping]);

  const total = Math.max(0, subtotal + shipping - discount);

  const applyCoupon = useCallback(
    (code: string): boolean => {
      const coupon = coupons.find(
        (c) => c.code.toUpperCase() === code.toUpperCase().trim()
      );
      if (!coupon || !coupon.active) return false;
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return false;
      if (coupon.minOrder && subtotal < coupon.minOrder) return false;
      setAppliedCoupon(coupon);
      return true;
    },
    [coupons, subtotal]
  );

  const removeCoupon = useCallback(() => setAppliedCoupon(null), []);

  const addItem = useCallback(
    (productId: string, size: string, quantity = 1): boolean => {
      const product = products.find((p) => p.id === productId);
      if (!product || !product.availableSizes.includes(size)) return false;

      setRawItems((prev) => {
        const existing = prev.find(
          (i) => i.productId === productId && i.size === size
        );
        if (existing) {
          return prev.map((i) =>
            i.productId === productId && i.size === size
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        }
        return [...prev, { productId, size, quantity }];
      });
      return true;
    },
    [products]
  );

  const removeItem = useCallback((productId: string, size: string) => {
    setRawItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.size === size))
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, size: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId, size);
        return;
      }
      setRawItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.size === size
            ? { ...i, quantity }
            : i
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setRawItems([]);
    setAppliedCoupon(null);
  }, []);

  const value: CartContextValue = {
    items,
    itemCount,
    subtotal,
    shipping,
    discount,
    total,
    appliedCoupon,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    toggleCart: () => setIsOpen((o) => !o),
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export { SHIPPING_COST };
