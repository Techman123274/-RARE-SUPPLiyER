"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductPrice } from "@/components/products/ProductPrice";
import { getRelatedProducts } from "@/lib/products";
import { useCatalog } from "@/context/CatalogContext";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SizeSelector } from "@/components/products/SizeSelector";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { ConditionIndicator } from "@/components/products/ConditionIndicator";
import { useCart } from "@/context/CartContext";
import { useFlyToCart } from "@/context/FlyToCartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatAvailability, primarySizeLabel } from "@/lib/product-utils";

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const { addItem, openCart } = useCart();
  const { triggerFly } = useFlyToCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.availableSizes.length === 1 ? product.availableSizes[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySaved, setNotifySaved] = useState(false);

  const { products } = useCatalog();
  const soldOut = product.availableSizes.length === 0 || product.stock <= 0;
  const wishlisted = isWishlisted(product.id);
  const related = getRelatedProducts(products, product);
  const maxQty = Math.max(1, product.stock);
  const sizeLabel = primarySizeLabel(product);

  const handleAddToCart = () => {
    if (soldOut) return;
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    const success = addItem(product.id, selectedSize, quantity);
    if (success) {
      const el = document.querySelector("[data-product-image]");
      if (el) {
        triggerFly({
          image: product.images[0],
          from: el.getBoundingClientRect(),
        });
      }
      setAdded(true);
      setTimeout(() => openCart(), 450);
      setTimeout(() => setAdded(false), 1800);
    }
  };

  const handleBuyNow = () => {
    if (soldOut) return;
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    addItem(product.id, selectedSize, quantity);
    router.push("/checkout");
  };

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    const key = "rare-suppliyer-notify";
    const existing = JSON.parse(localStorage.getItem(key) || "[]") as Array<{
      sku: string;
      email: string;
    }>;
    localStorage.setItem(
      key,
      JSON.stringify([...existing, { sku: product.sku, email: notifyEmail.trim() }])
    );
    setNotifySaved(true);
  };

  return (
    <div>
      <FadeIn>
        <nav className="text-[10px] tracking-[0.16em] text-muted mb-8 flex flex-wrap items-center gap-2" aria-label="Breadcrumb">
          <Link href="/" className="link-line hover:text-foreground transition-colors">
            HOME
          </Link>
          <span>/</span>
          <Link href="/shop" className="link-line hover:text-foreground transition-colors">
            SHOP
          </Link>
          <span>/</span>
          <Link
            href={`/shop?category=${encodeURIComponent(product.category)}`}
            className="link-line hover:text-foreground transition-colors"
          >
            {product.category.toUpperCase()}
          </Link>
        </nav>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-14">
        <FadeIn>
          <ProductGallery images={product.images} alt={`${product.brand} ${product.name}`} />
        </FadeIn>

        <FadeIn delay={0.08}>
          <div className="space-y-6 lg:sticky lg:top-20">
            <div>
              <p className="text-[10px] tracking-[0.24em] text-muted uppercase mb-2">
                {product.brand}
              </p>
              <h1 className="text-3xl sm:text-4xl font-display tracking-[0.06em] mb-3">
                {product.name}
              </h1>
              <ProductPrice product={product} className="text-2xl font-mono" />
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="border border-border px-3 py-3">
                <dt className="text-[10px] tracking-[0.18em] text-muted mb-1">SIZE</dt>
                <dd className="font-mono">{sizeLabel ?? "—"}</dd>
              </div>
              <div className="border border-border px-3 py-3">
                <dt className="text-[10px] tracking-[0.18em] text-muted mb-1">CONDITION</dt>
                <dd className="font-mono uppercase">{product.condition}</dd>
              </div>
              <div className="border border-border px-3 py-3 col-span-2">
                <dt className="text-[10px] tracking-[0.18em] text-muted mb-1">AVAILABILITY</dt>
                <dd
                  className={cn(
                    "font-mono uppercase",
                    soldOut && "text-red-300",
                    product.availability === "low_stock" && "text-amber-200"
                  )}
                >
                  {formatAvailability(product)}
                </dd>
              </div>
            </dl>

            {!soldOut ? (
              <>
                <SizeSelector
                  sizes={product.sizes}
                  availableSizes={product.availableSizes}
                  selectedSize={selectedSize}
                  onSelect={(size) => {
                    setSelectedSize(size);
                    setSizeError(false);
                  }}
                />
                {sizeError && (
                  <p className="text-xs text-red-400">Please select a size</p>
                )}

                <div>
                  <span className="text-[10px] tracking-[0.18em] font-medium uppercase block mb-3">
                    Quantity
                  </span>
                  <div className="inline-flex items-center border border-border">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2.5 hover:bg-surface-elevated transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-5 text-sm font-mono">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                      className="p-2.5 hover:bg-surface-elevated transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <Button
                    size="lg"
                    className="flex-1"
                    success={added}
                    onClick={handleAddToCart}
                  >
                    {added ? undefined : "ADD TO BAG"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                    onClick={handleBuyNow}
                  >
                    BUY NOW
                  </Button>
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={cn(
                      "p-3.5 border border-border hover:border-accent-secondary/40 transition-all",
                      wishlisted && "text-red-400 border-red-400/30"
                    )}
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart className={cn("w-5 h-5", wishlisted && "fill-current")} />
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4 py-2">
                <Button size="lg" disabled className="w-full sm:w-auto">
                  SOLD
                </Button>
                <form onSubmit={handleNotify} className="glass p-4 space-y-3">
                  <p className="text-[10px] tracking-[0.18em] font-mono">NOTIFY ME</p>
                  <p className="text-sm text-muted">
                    Leave your email. This is saved locally until backend alerts are connected.
                  </p>
                  {notifySaved ? (
                    <p className="text-sm text-accent-secondary">Saved for this product.</p>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="field-input"
                      />
                      <Button type="submit" size="sm">
                        SAVE
                      </Button>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </FadeIn>
      </div>

      <div className="mt-14 grid md:grid-cols-2 gap-px bg-border">
        {(product.conditionDetails || product.condition) && (
          <section className="bg-background p-6 sm:p-8">
            <h2 className="text-[10px] tracking-[0.22em] text-muted mb-3">CONDITION DETAILS</h2>
            <ConditionIndicator
              condition={product.condition}
              details={product.conditionDetails}
            />
          </section>
        )}
        {product.description && (
          <section className="bg-background p-6 sm:p-8">
            <h2 className="text-[10px] tracking-[0.22em] text-muted mb-3">ITEM INFORMATION</h2>
            <p className="text-sm text-muted leading-relaxed">{product.description}</p>
            {product.sku && (
              <p className="text-[10px] font-mono text-muted tracking-wider mt-4">
                SKU {product.sku}
              </p>
            )}
          </section>
        )}
        <section className="bg-background p-6 sm:p-8">
          <h2 className="text-[10px] tracking-[0.22em] text-muted mb-3">SHIPPING</h2>
          <p className="text-sm text-muted leading-relaxed mb-3">
            Shipping details are listed on the shipping page.
          </p>
          <Link href="/shipping" className="text-[10px] tracking-[0.18em] text-accent-secondary link-line">
            VIEW SHIPPING
          </Link>
        </section>
        <section className="bg-background p-6 sm:p-8">
          <h2 className="text-[10px] tracking-[0.22em] text-muted mb-3">RETURNS</h2>
          <p className="text-sm text-muted leading-relaxed mb-3">
            Return details are listed on the returns page.
          </p>
          <Link href="/returns" className="text-[10px] tracking-[0.18em] text-accent-secondary link-line">
            VIEW RETURNS
          </Link>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-16 sm:mt-20 pt-10 border-t border-border">
          <FadeIn>
            <h2 className="text-sm tracking-[0.2em] font-display mb-8">
              MORE FROM INVENTORY
            </h2>
          </FadeIn>
          <ProductGrid products={related} />
        </section>
      )}

      {!soldOut && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 glass-strong border-t border-border sm:hidden">
          <Button size="lg" className="w-full" success={added} onClick={handleAddToCart}>
            {added ? undefined : selectedSize ? "ADD TO BAG" : "SELECT SIZE"}
          </Button>
        </div>
      )}
    </div>
  );
}
