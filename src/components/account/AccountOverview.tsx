"use client";

import Link from "next/link";
import { Heart, Package, Search, Shield, Star, User } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { ProductGrid } from "@/components/products/ProductGrid";

export function AccountOverview() {
  const { user, profile, isStaff } = useAuth();
  const { wishlistProducts } = useWishlist();
  const created = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <>
      {isStaff && (
        <FadeIn>
          <section className="glass p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-accent-secondary/30">
            <div>
              <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] font-mono text-accent-secondary mb-2">
                <Shield className="w-4 h-4" />
                STAFF ACCESS
              </div>
              <p className="text-sm text-muted">
                This account can manage inventory, orders, requests, and store settings.
              </p>
            </div>
            <Link href="/admin">
              <Button>OPEN ADMIN</Button>
            </Link>
          </section>
        </FadeIn>
      )}

      <FadeIn>
        <section className="glass p-6 space-y-4">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] font-mono text-muted">
            <User className="w-4 h-4" />
            PROFILE
          </div>
          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted text-[10px] tracking-[0.16em] mb-1">NAME</dt>
              <dd>{profile?.display_name || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-muted text-[10px] tracking-[0.16em] mb-1">EMAIL</dt>
              <dd className="break-all">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-muted text-[10px] tracking-[0.16em] mb-1">ACCOUNT CREATED</dt>
              <dd>{created}</dd>
            </div>
          </dl>
          <Link href="/account/profile">
            <Button variant="secondary" size="sm">
              EDIT PROFILE
            </Button>
          </Link>
        </section>
      </FadeIn>

      <div className="grid sm:grid-cols-2 gap-3">
        <QuickLink href="/account/orders" icon={Package} label="ORDERS" copy="Order history and reviews." />
        <QuickLink href="/account/wishlist" icon={Heart} label="WISHLIST" copy="Items you've saved from the shop." />
        <QuickLink href="/account/requests" icon={Search} label="REQUESTS" copy="Sourcing requests you've submitted." />
        <QuickLink href="/account/settings" icon={Shield} label="SETTINGS" copy="Name, password, and sign out." />
      </div>

      <FadeIn delay={0.08}>
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] font-mono text-muted">
              <Heart className="w-4 h-4" />
              WISHLIST
            </div>
            <Link href="/account/wishlist" className="text-[10px] tracking-[0.16em] text-muted hover:text-foreground">
              VIEW ALL
            </Link>
          </div>
          {wishlistProducts.length > 0 ? (
            <ProductGrid products={wishlistProducts.slice(0, 4)} />
          ) : (
            <EmptyState
              title="NO SAVED ITEMS"
              description="Save products from the shop to see them here."
              action={
                <Link href="/shop">
                  <Button variant="secondary" size="sm">BROWSE INVENTORY</Button>
                </Link>
              }
            />
          )}
        </section>
      </FadeIn>

      <FadeIn delay={0.12}>
        <section className="glass p-6 space-y-3">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] font-mono text-muted">
            <Star className="w-4 h-4" />
            REVIEWS
          </div>
          <p className="text-sm text-muted">Reviews you&apos;ve written for purchases.</p>
          <Link href="/account/reviews">
            <Button variant="secondary" size="sm">
              MY REVIEWS
            </Button>
          </Link>
        </section>
      </FadeIn>
    </>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  copy,
}: {
  href: string;
  icon: typeof Package;
  label: string;
  copy: string;
}) {
  return (
    <Link href={href} className="glass p-5 block hover:border-accent-secondary/30 transition-colors">
      <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] font-mono text-muted mb-2">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className="text-sm text-muted">{copy}</p>
    </Link>
  );
}
