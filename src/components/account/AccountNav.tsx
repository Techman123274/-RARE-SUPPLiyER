"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const links = [
  { href: "/account", label: "OVERVIEW" },
  { href: "/account/requests", label: "MY REQUESTS" },
  { href: "/account/reviews", label: "MY REVIEWS" },
  { href: "/account/orders", label: "MY ORDERS" },
  { href: "/account/wishlist", label: "MY WISHLIST" },
  { href: "/account/profile", label: "MY PROFILE" },
  { href: "/account/settings", label: "SETTINGS" },
];

export function AccountNav() {
  const pathname = usePathname();
  const { isStaff } = useAuth();

  return (
    <nav className="flex gap-2 overflow-x-auto scrollbar-hide mb-8" aria-label="Account">
      {links.map((link) => {
        const active =
          link.href === "/account"
            ? pathname === "/account"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-3 py-2 text-[10px] tracking-[0.2em] font-mono border whitespace-nowrap transition-colors",
              active
                ? "border-accent-secondary text-accent-secondary"
                : "border-border text-muted hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
      {isStaff && (
        <Link
          href="/admin"
          className="px-3 py-2 text-[10px] tracking-[0.2em] font-mono border whitespace-nowrap border-accent-secondary text-accent-secondary"
        >
          ADMIN
        </Link>
      )}
    </nav>
  );
}
