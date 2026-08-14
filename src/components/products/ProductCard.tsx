"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { cn, formatPrice, productHref } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";
import { useWishlist } from "@/context/WishlistContext";
import { primarySizeLabel } from "@/lib/product-utils";
import { useReducedMotion } from "@/hooks/useMotionPrefs";
import { DURATION, EASE, STAGGER } from "@/lib/motion";
import { QuickView } from "./QuickView";

interface ProductCardProps {
  product: Product;
  index?: number;
  variant?: "default" | "large";
}

function statusBadge(product: Product) {
  if (product.availableSizes.length === 0 || product.stock <= 0) {
    return { label: "SOLD", tone: "sold" as const };
  }
  if (product.badge === "NEW") {
    return { label: "NEW", tone: "new" as const };
  }
  if (product.availability === "low_stock") {
    return { label: "LOW STOCK", tone: "low" as const };
  }
  return { label: "IN STOCK", tone: "stock" as const };
}

export function ProductCard({ product, index = 0, variant = "default" }: ProductCardProps) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [quickOpen, setQuickOpen] = useState(false);
  const wishlisted = isWishlisted(product.id);
  const reduced = useReducedMotion();
  const badge = statusBadge(product);
  const sizeLabel = primarySizeLabel(product);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickOpen(true);
  };

  const staggerGroup = Math.floor(index / 4);

  return (
    <>
      <motion.article
        initial={reduced ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{
          duration: DURATION.normal,
          delay: reduced ? 0 : (index % 4) * STAGGER + staggerGroup * 0.03,
          ease: EASE.premium,
        }}
        className={cn(
          "group product-card-hover overflow-hidden bg-surface border border-border",
          variant === "large" && "lg:col-span-1"
        )}
      >
        <Link href={productHref(product)} className="block">
          <div
            className={cn(
              "relative overflow-hidden studio-well",
              variant === "large" ? "aspect-[4/5]" : "aspect-[4/5]"
            )}
          >
            <SafeImage
              src={product.images[0]}
              alt={`${product.brand} ${product.name}`}
              fill
              className="object-contain p-4 transition-transform duration-500 ease-premium group-hover:scale-[1.04]"
              sizes={
                variant === "large"
                  ? "(max-width:768px) 100vw, 33vw"
                  : "(max-width:768px) 50vw, 20vw"
              }
            />

            <span
              className={cn(
                "absolute top-3 left-3 z-10 px-2 py-0.5 text-[9px] tracking-[0.16em] font-mono border backdrop-blur-sm",
                badge.tone === "new" && "border-accent-secondary/40 text-accent-secondary bg-background/50",
                badge.tone === "stock" && "border-border text-foreground/80 bg-background/50",
                badge.tone === "low" && "border-amber-400/30 text-amber-200 bg-background/50",
                badge.tone === "sold" && "border-red-400/30 text-red-300 bg-background/50"
              )}
            >
              {badge.label}
            </span>

            <button
              onClick={handleWishlist}
              className={cn(
                "absolute top-3 right-3 w-10 h-10 glass flex items-center justify-center transition-colors z-10",
                wishlisted && "text-red-400"
              )}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={cn("w-4 h-4", wishlisted && "fill-current")} />
            </button>

            <div className="absolute inset-x-3 bottom-3 z-10 opacity-100 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 sm:group-focus-within:opacity-100 sm:group-focus-within:translate-y-0 transition-all duration-300">
              <button
                onClick={handleQuickView}
                className="w-full py-2.5 text-[10px] tracking-[0.2em] font-medium bg-background/85 backdrop-blur-md border border-border hover:border-accent-secondary/50 hover:text-accent-secondary transition-colors"
              >
                QUICK VIEW
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4 space-y-1.5">
            <p className="text-[10px] tracking-[0.22em] text-muted uppercase">
              {product.brand}
            </p>
            <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors">
              {product.name}
            </h3>
            <p className="text-[10px] tracking-[0.12em] text-muted font-mono uppercase">
              {sizeLabel ? `SIZE ${sizeLabel}` : "SIZE —"} · {product.condition}
            </p>
            <p className="text-sm font-mono pt-0.5">{formatPrice(product.price)}</p>
          </div>
        </Link>
      </motion.article>

      <QuickView product={product} isOpen={quickOpen} onClose={() => setQuickOpen(false)} />
    </>
  );
}
