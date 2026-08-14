"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Heart, Search, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";
import { shopHref } from "@/lib/categories";

const navLinks = [
  { href: "/", label: "HOME", category: null },
  { href: "/shop", label: "SHOP", category: null },
  { href: shopHref("Sneakers"), label: "SNEAKERS", category: "Sneakers" },
  { href: shopHref("Clothing"), label: "CLOTHING", category: "Clothing" },
  { href: shopHref("Accessories"), label: "ACCESSORIES", category: "Accessories" },
  { href: shopHref("Other"), label: "OTHER", category: "Other" },
  { href: "/request", label: "REQUEST", category: null },
  { href: "/about", label: "ABOUT", category: null },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const { isAuthenticated, isStaff } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 bottom-0 z-50 w-[min(360px,88vw)] glass-strong lg:hidden flex flex-col"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Logo variant="nav" />
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-elevated rounded-sm transition-colors min-h-11 min-w-11"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-4 px-4 overflow-y-auto">
              {navLinks.map((link, i) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : link.href === "/request" || link.href === "/about"
                      ? pathname === link.href
                      : link.category
                        ? pathname === "/shop" && categoryParam === link.category
                        : pathname === "/shop" && !categoryParam;
                return (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      href={link.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center py-3.5 text-sm tracking-[0.22em] font-display border-b border-border/70 transition-colors",
                        active ? "text-accent-secondary" : "text-muted hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            <div className="p-4 border-t border-border space-y-1">
              <Link
                href="/wishlist"
                onClick={onClose}
                className="flex items-center gap-3 py-3 text-xs tracking-[0.18em] text-muted hover:text-foreground transition-colors min-h-11"
              >
                <Heart className="w-4 h-4" />
                WISHLIST
              </Link>
              <Link
                href={isAuthenticated ? "/account" : "/login"}
                onClick={onClose}
                className="flex items-center gap-3 py-3 text-xs tracking-[0.18em] text-muted hover:text-foreground transition-colors min-h-11"
              >
                <User className="w-4 h-4" />
                ACCOUNT
              </Link>
              {isStaff && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center gap-3 py-3 text-xs tracking-[0.18em] text-accent-secondary hover:text-foreground transition-colors min-h-11"
                >
                  <Shield className="w-4 h-4" />
                  ADMIN
                </Link>
              )}
              <Link
                href="/shop"
                onClick={onClose}
                className="flex items-center gap-3 py-3 text-xs tracking-[0.18em] text-muted hover:text-foreground transition-colors min-h-11"
              >
                <Search className="w-4 h-4" />
                BROWSE INVENTORY
              </Link>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
