"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Search, User, ShoppingBag, Menu, Heart, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { MobileMenu } from "./MobileMenu";
import { SearchModal } from "@/components/search/SearchModal";
import { shopHref } from "@/lib/categories";

const centerLinks = [
  { href: "/shop", label: "SHOP", category: null },
  { href: shopHref("Sneakers"), label: "SNEAKERS", category: "Sneakers" },
  { href: shopHref("Clothing"), label: "CLOTHING", category: "Clothing" },
  { href: shopHref("Accessories"), label: "ACCESSORIES", category: "Accessories" },
  { href: "/request", label: "REQUEST", category: null },
];

function isNavActive(pathname: string, categoryParam: string | null, link: (typeof centerLinks)[number]) {
  if (link.href === "/request") return pathname === "/request";
  if (link.href === "/shop" && !link.category) {
    return pathname === "/shop" && !categoryParam;
  }
  return pathname === "/shop" && categoryParam === link.category;
}

function NavbarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const { itemCount, openCart } = useCart();
  const { wishlistIds } = useWishlist();
  const { isAuthenticated, isStaff } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={false}
        className={cn(
          "fixed top-0 left-0 right-0 z-40 border-b border-border/70 transition-colors duration-300",
          scrolled ? "bg-black/90 backdrop-blur-xl" : "bg-black"
        )}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-2 sm:gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="lg:hidden p-2 -ml-2 hover:bg-surface-elevated rounded-sm transition-colors flex-shrink-0 min-h-11 min-w-11"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Logo variant="nav" />
            </div>

            <nav
              className="hidden lg:flex flex-1 items-center justify-center gap-x-3 xl:gap-x-5 2xl:gap-x-6 min-w-0 flex-nowrap"
              aria-label="Main"
            >
              {centerLinks.map((link) => {
                const active = isNavActive(pathname, categoryParam, link);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "nav-indicator shrink-0 text-[10px] xl:text-[11px] tracking-[0.12em] xl:tracking-[0.18em] 2xl:tracking-[0.22em] font-medium transition-colors duration-200 whitespace-nowrap",
                      active ? "text-foreground" : "text-muted hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto lg:ml-0 flex items-center justify-end gap-0.5 shrink-0">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 hover:bg-surface-elevated rounded-sm transition-colors min-h-11 min-w-11 2xl:min-w-0 2xl:px-3"
                aria-label="Search"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span className="hidden 2xl:inline text-[10px] tracking-[0.2em]">SEARCH</span>
                </span>
              </button>
              <Link
                href="/wishlist"
                className="hidden sm:flex p-2.5 hover:bg-surface-elevated rounded-sm transition-colors relative min-h-11 min-w-11 2xl:min-w-0 2xl:px-3 items-center justify-center"
                aria-label="Wishlist"
              >
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  <span className="hidden 2xl:inline text-[10px] tracking-[0.2em]">WISHLIST</span>
                </span>
                {wishlistIds.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent-secondary rounded-full" />
                )}
              </Link>
              <Link
                href={isAuthenticated ? "/account" : "/login"}
                className="hidden sm:flex p-2.5 hover:bg-surface-elevated rounded-sm transition-colors relative min-h-11 min-w-11 2xl:min-w-0 2xl:px-3 items-center justify-center"
                aria-label="Account"
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden 2xl:inline text-[10px] tracking-[0.2em]">ACCOUNT</span>
                </span>
                {isAuthenticated && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-secondary" />
                )}
              </Link>
              {isStaff && (
                <Link
                  href="/admin"
                  className="hidden sm:flex p-2.5 hover:bg-surface-elevated rounded-sm transition-colors min-h-11 min-w-11 2xl:min-w-0 2xl:px-3 items-center justify-center text-accent-secondary"
                  aria-label="Admin"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="hidden 2xl:inline text-[10px] tracking-[0.2em]">ADMIN</span>
                  </span>
                </Link>
              )}
              <button
                onClick={openCart}
                data-cart-icon
                className="p-2.5 hover:bg-surface-elevated rounded-sm transition-colors relative min-h-11 min-w-11 2xl:min-w-0 2xl:px-3"
                aria-label={`Bag, ${itemCount} items`}
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden 2xl:inline text-[10px] tracking-[0.2em]">BAG</span>
                </span>
                <AnimatePresence mode="popLayout">
                  {itemCount > 0 && (
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-1 right-1 w-4 h-4 bg-accent-secondary text-background text-[9px] font-bold rounded-full flex items-center justify-center"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={<div className="h-14" />}>
      <NavbarInner />
    </Suspense>
  );
}
