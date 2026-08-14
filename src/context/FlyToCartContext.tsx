"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export interface FlyPayload {
  id: string;
  image: string;
  from: DOMRect;
}

interface FlyToCartContextValue {
  fly: FlyPayload | null;
  toast: boolean;
  triggerFly: (payload: Omit<FlyPayload, "id">) => void;
  clearFly: () => void;
}

const FlyToCartContext = createContext<FlyToCartContextValue | null>(null);

export function FlyToCartProvider({ children }: { children: ReactNode }) {
  const [fly, setFly] = useState<FlyPayload | null>(null);
  const [toast, setToast] = useState(false);

  const triggerFly = useCallback((payload: Omit<FlyPayload, "id">) => {
    setFly({ ...payload, id: `${Date.now()}` });
    setToast(true);
    setTimeout(() => setToast(false), 2200);
  }, []);

  const clearFly = useCallback(() => setFly(null), []);

  return (
    <FlyToCartContext.Provider value={{ fly, toast, triggerFly, clearFly }}>
      {children}
    </FlyToCartContext.Provider>
  );
}

export function useFlyToCart() {
  const ctx = useContext(FlyToCartContext);
  if (!ctx) throw new Error("useFlyToCart must be used within FlyToCartProvider");
  return ctx;
}
