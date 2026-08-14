"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useCatalog } from "@/context/CatalogContext";
import { useAuth } from "@/context/AuthContext";
import { safeParseJSON } from "@/lib/storage";
import { fetchRemoteWishlistIds, persistWishlistItem } from "@/lib/wishlist-remote";

const WISHLIST_STORAGE_KEY = "rare-suppliyer-wishlist";

interface WishlistContextValue {
  wishlistIds: string[];
  wishlistProducts: ReturnType<typeof useCatalog>["products"];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { products } = useCatalog();
  const { user, isAuthenticated } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const parsed = safeParseJSON<string[]>(
      localStorage.getItem(WISHLIST_STORAGE_KEY),
      []
    );
    const next = Array.isArray(parsed) ? parsed : [];
    const id = requestAnimationFrame(() => {
      setWishlistIds(next);
      setHydrated(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    }
  }, [wishlistIds, hydrated]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || !user) return;
    let cancelled = false;

    fetchRemoteWishlistIds(user.id).then((remote) => {
      if (cancelled || !remote) return;
      setWishlistIds((local) => Array.from(new Set([...local, ...remote])));
    });

    return () => {
      cancelled = true;
    };
  }, [hydrated, isAuthenticated, user?.id]);

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id)),
    [products, wishlistIds]
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlistIds((prev) => {
        const next = prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId];
        if (user) {
          void persistWishlistItem(user.id, productId, next.includes(productId));
        }
        return next;
      });
    },
    [user]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
      if (user) {
        void persistWishlistItem(user.id, productId, false);
      }
    },
    [user]
  );

  return (
    <WishlistContext.Provider
      value={{ wishlistIds, wishlistProducts, isWishlisted, toggleWishlist, removeFromWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
