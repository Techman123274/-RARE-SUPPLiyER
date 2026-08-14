"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Coupon, Product } from "@/lib/types";
import { PRODUCT_CATEGORIES } from "@/lib/types";
import { products as seedProducts, SHIPPING_COST } from "@/data/products";
import { defaultCoupons } from "@/data/coupons";
import { normalizeProduct } from "@/lib/product-utils";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { fetchStorefrontCatalog } from "@/lib/store/catalog";
import { unavailableCatalogMessage } from "@/lib/supabase/errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const CATALOG_KEY = "rare-suppliyer-catalog";

interface CatalogContextValue {
  products: Product[];
  coupons: Coupon[];
  categories: string[];
  hydrated: boolean;
  remote: boolean;
  catalogError: string | null;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCoupon: (coupon: Coupon) => void;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  resetCatalog: () => void;
  refreshCatalog: () => Promise<boolean>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

function emptyLocalCatalog(): { products: Product[]; coupons: Coupon[] } {
  return {
    products: seedProducts.map((p) =>
      normalizeProduct(p as unknown as Record<string, unknown>)
    ),
    coupons: defaultCoupons,
  };
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const remote = isSupabaseConfigured();
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<string[]>(PRODUCT_CATEGORIES);
  const [hydrated, setHydrated] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const refreshCatalog = useCallback(async () => {
    if (!remote) {
      const loaded = emptyLocalCatalog();
      setProducts(loaded.products);
      setCoupons(loaded.coupons);
      setCategories(
        Array.from(new Set(loaded.products.map((p) => p.category))).sort()
      );
      setCatalogError(null);
      setHydrated(true);
      return true;
    }

    try {
      window.localStorage.removeItem(CATALOG_KEY);
    } catch {
      // Ignore storage access errors.
    }

    const catalog = await fetchStorefrontCatalog();
    if (catalog) {
      setProducts(catalog.products);
      setCoupons(catalog.coupons);
      setCategories(
        catalog.categories.length
          ? catalog.categories.map((c) => c.name)
          : Array.from(new Set(catalog.products.map((p) => p.category)))
      );
      setCatalogError(null);
      setHydrated(true);
      return true;
    }

    setProducts([]);
    setCoupons([]);
    setCatalogError(unavailableCatalogMessage());
    setHydrated(true);
    return false;
  }, [remote]);

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const run = async () => {
      const ok = await refreshCatalog();
      if (cancelled || ok) return;
      attempt += 1;
      if (attempt < 8) {
        timeout = setTimeout(() => {
          void run();
        }, Math.min(30_000, 4_000 * attempt));
      }
    };

    void run();
    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [refreshCatalog]);

  useEffect(() => {
    if (!remote || !hydrated || catalogError) return;
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel("storefront-catalog")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        void refreshCatalog();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "product_sizes" }, () => {
        void refreshCatalog();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "product_images" }, () => {
        void refreshCatalog();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [remote, hydrated, catalogError, refreshCatalog]);

  const addProduct = useCallback((product: Product) => {
    if (remote) return;
    setProducts((prev) => [product, ...prev]);
  }, [remote]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    if (remote) return;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, [remote]);

  const deleteProduct = useCallback((id: string) => {
    if (remote) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, [remote]);

  const addCoupon = useCallback((coupon: Coupon) => {
    if (remote) return;
    setCoupons((prev) => [coupon, ...prev]);
  }, [remote]);

  const updateCoupon = useCallback((id: string, updates: Partial<Coupon>) => {
    if (remote) return;
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, [remote]);

  const deleteCoupon = useCallback((id: string) => {
    if (remote) return;
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  }, [remote]);

  const resetCatalog = useCallback(() => {
    if (remote) return;
    setProducts(seedProducts.map((p) => normalizeProduct(p as unknown as Record<string, unknown>)));
    setCoupons(defaultCoupons);
  }, [remote]);

  const value = useMemo(
    () => ({
      products,
      coupons,
      categories,
      hydrated,
      remote,
      catalogError,
      addProduct,
      updateProduct,
      deleteProduct,
      addCoupon,
      updateCoupon,
      deleteCoupon,
      resetCatalog,
      refreshCatalog,
    }),
    [
      products,
      coupons,
      categories,
      hydrated,
      remote,
      catalogError,
      addProduct,
      updateProduct,
      deleteProduct,
      addCoupon,
      updateCoupon,
      deleteCoupon,
      resetCatalog,
      refreshCatalog,
    ]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}

export { SHIPPING_COST };
