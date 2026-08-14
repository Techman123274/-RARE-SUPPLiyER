"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Plus,
  Tags,
  Boxes,
  ShoppingCart,
  Users,
  TicketPercent,
  Megaphone,
  Image as ImageIcon,
  BarChart3,
  Settings,
  ScrollText,
  Shield,
  Menu,
  X,
  ExternalLink,
  LogOut,
  Inbox,
  Star,
  ClipboardList,
} from "lucide-react";
import { logoutAdmin } from "@/app/admin/actions";
import { cn } from "@/lib/utils";
import { hasCapability, type StaffCapability } from "@/lib/store/roles";
import type { AppRole } from "@/lib/supabase/database.types";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  cap?: StaffCapability;
};

type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  { label: "Dashboard", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Products",
    items: [
      { href: "/admin/products", label: "All Products", icon: Package, cap: "products.write" },
      { href: "/admin/products/new", label: "Add Product", icon: Plus, cap: "products.write" },
      { href: "/admin/categories", label: "Categories", icon: Tags, cap: "categories.write" },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes, cap: "inventory.write" },
    ],
  },
  {
    label: "Orders",
    items: [
      { href: "/admin/orders", label: "All Orders", icon: ShoppingCart, cap: "orders.write" },
      { href: "/admin/orders?status=pending", label: "Pending", icon: ShoppingCart, cap: "orders.write" },
      { href: "/admin/orders?status=processing", label: "Processing", icon: ShoppingCart, cap: "orders.write" },
      { href: "/admin/orders?status=shipped", label: "Shipped", icon: ShoppingCart, cap: "orders.write" },
      { href: "/admin/orders?status=delivered", label: "Completed", icon: ShoppingCart, cap: "orders.write" },
      { href: "/admin/orders?status=cancelled", label: "Cancelled", icon: ShoppingCart, cap: "orders.write" },
      { href: "/admin/orders?status=refunded", label: "Refunded", icon: ShoppingCart, cap: "orders.write" },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users, cap: "customers.read" },
      { href: "/admin/requests", label: "Customer Requests", icon: Inbox, cap: "requests.write" },
    ],
  },
  {
    label: "Reviews",
    items: [
      { href: "/admin/reviews?status=pending", label: "Pending", icon: Star, cap: "reviews.moderate" },
      { href: "/admin/reviews?status=approved", label: "Approved", icon: Star, cap: "reviews.moderate" },
      { href: "/admin/reviews?reported=1", label: "Reported", icon: Star, cap: "reviews.moderate" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/coupons", label: "Coupons", icon: TicketPercent, cap: "marketing.write" },
      { href: "/admin/deals", label: "Deals", icon: Megaphone, cap: "marketing.write" },
    ],
  },
  {
    label: "Content",
    items: [{ href: "/admin/content", label: "Homepage / Banners", icon: ImageIcon, cap: "content.write" }],
  },
  {
    label: "Analytics",
    items: [
      { href: "/admin/analytics", label: "Sales", icon: BarChart3, cap: "analytics.read" },
      { href: "/admin/analytics?view=reviews", label: "Reviews", icon: Star, cap: "analytics.read" },
      { href: "/admin/analytics?view=requests", label: "Requests", icon: ClipboardList, cap: "analytics.read" },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/activity", label: "Activity", icon: ScrollText },
      { href: "/admin/users", label: "Admin Users", icon: Shield, cap: "admins.write" },
      { href: "/admin/settings", label: "Store Settings", icon: Settings, cap: "settings.write" },
    ],
  },
];

function itemActive(pathname: string, search: string, href: string) {
  const [path, query] = href.split("?");
  if (query) {
    return pathname === path && (search === `?${query}` || search.includes(query));
  }
  if (path === "/admin") return pathname === "/admin";
  if (path === "/admin/products") {
    return pathname === "/admin/products" || (pathname.startsWith("/admin/products/") && pathname !== "/admin/products/new");
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function AdminShell({
  role,
  email,
  children,
}: {
  role: AppRole;
  email: string;
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminShellFrame role={role} email={email} search="">{children}</AdminShellFrame>}>
      <AdminShellWithSearch role={role} email={email}>
        {children}
      </AdminShellWithSearch>
    </Suspense>
  );
}

function AdminShellWithSearch({
  role,
  email,
  children,
}: {
  role: AppRole;
  email: string;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return (
    <AdminShellFrame role={role} email={email} search={search}>
      {children}
    </AdminShellFrame>
  );
}

function AdminShellFrame({
  role,
  email,
  search,
  children,
}: {
  role: AppRole;
  email: string;
  search: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.cap || hasCapability(role, item.cap)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="admin-app flex min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-[#101218] p-4 transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] tracking-[0.28em] text-[#4da3ff] font-mono">RARE SUPPLiyER</p>
            <p className="text-sm font-medium mt-1">Admin</p>
          </div>
          <button className="lg:hidden p-2" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="space-y-5 overflow-y-auto max-h-[calc(100vh-10rem)] pr-1">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-[10px] tracking-[0.2em] text-[#6b7385] uppercase">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = itemActive(pathname, search, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-[#8b93a5] hover:bg-white/5 hover:text-white",
                        active && "bg-white/10 text-white"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0c0d12]/90 px-4 py-3 backdrop-blur">
          <button className="lg:hidden p-2" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <p className="text-xs text-[#8b93a5] truncate">{email} · {role.replaceAll("_", " ")}</p>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="hidden sm:flex items-center gap-1 text-xs text-[#8b93a5] hover:text-white">
              Store <ExternalLink className="w-3 h-3" />
            </Link>
            <form action={logoutAdmin}>
              <button className="flex items-center gap-1.5 text-xs border border-white/10 rounded-md px-3 py-1.5 hover:bg-white/5">
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </form>
          </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">{children}</div>
      </div>
    </div>
  );
}
