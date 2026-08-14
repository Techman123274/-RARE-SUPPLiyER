"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, Tag } from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { useCart } from "@/context/CartContext";
import { FadeIn } from "@/components/ui/FadeIn";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductBadge } from "@/components/ui/ProductBadge";
import type { ProductBadge as BadgeType } from "@/lib/types";

export function DealsContent() {
  const { coupons } = useCatalog();
  const { applyCoupon, appliedCoupon } = useCart();
  const [copied, setCopied] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");

  const activeDeals = coupons.filter((c) => {
    if (!c.active) return false;
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return false;
    return true;
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleApply = (code: string) => {
    const ok = applyCoupon(code);
    if (ok) {
      setError("");
      setInputCode("");
    } else {
      setError("Invalid or expired code, or minimum order not met.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <FadeIn>
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.4em] text-accent-secondary font-mono mb-4">
            EXCLUSIVE SAVINGS
          </p>
          <h1 className="text-4xl sm:text-5xl font-display tracking-[0.08em] mb-4">
            DEALS & COUPONS
          </h1>
          <p className="text-muted text-sm max-w-md mx-auto">
            Drop codes, limited promos, and seasonal deals — updated by the RARE SUPPLiyER team.
          </p>
        </div>
      </FadeIn>

      {/* Apply code */}
      <FadeIn delay={0.1}>
        <div className="glass p-6 mb-10">
          <h2 className="text-xs tracking-[0.2em] font-medium mb-4">APPLY A CODE</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={inputCode}
              onChange={(e) => { setInputCode(e.target.value.toUpperCase()); setError(""); }}
              placeholder="Enter coupon code"
              className="field-input font-mono"
            />
            <Button onClick={() => handleApply(inputCode)} size="lg">
              APPLY
            </Button>
          </div>
          {appliedCoupon && (
            <p className="text-xs text-emerald-400 mt-3">
              ✓ {appliedCoupon.code} applied — {appliedCoupon.title}
            </p>
          )}
          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
        </div>
      </FadeIn>

      {/* Active deals grid */}
      <FadeIn delay={0.15}>
        <h2 className="text-xs tracking-[0.2em] font-medium mb-6">
          {activeDeals.length} ACTIVE DEAL{activeDeals.length !== 1 ? "S" : ""}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeDeals.map((deal) => (
            <div
              key={deal.id}
              className="glass p-6 glow-border group"
            >
              <div className="flex items-start justify-between mb-4">
                <Tag className="w-5 h-5 text-accent-secondary" />
                {deal.badge && (
                  <ProductBadge badge={deal.badge as BadgeType} />
                )}
              </div>
              <h3 className="text-lg font-medium mb-1">{deal.title}</h3>
              <p className="text-sm text-muted mb-4">{deal.description}</p>
              {deal.minOrder && (
                <p className="text-[10px] text-muted mb-3">Min. order ${deal.minOrder}</p>
              )}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                <span className="font-mono text-sm tracking-widest">{deal.code}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyCode(deal.code)}
                    className="p-2 border border-border rounded-md hover:bg-surface-elevated transition-colors"
                    aria-label="Copy code"
                  >
                    {copied === deal.code ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <Button size="sm" variant="secondary" onClick={() => handleApply(deal.code)}>
                    USE
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </FadeIn>

      {activeDeals.length === 0 && (
        <EmptyState
          title="NO ACTIVE DEALS"
          description="There are no live coupon codes right now."
        />
      )}

      <FadeIn delay={0.2}>
        <div className="mt-12 text-center">
          <Link href="/shop">
            <Button variant="secondary" size="lg">SHOP NOW</Button>
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
