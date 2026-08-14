import type { AppRole } from "@/lib/supabase/database.types";

export const STAFF_ROLES: AppRole[] = [
  "admin",
  "manager",
  "inventory_manager",
  "order_manager",
  "marketing_manager",
];

export type StaffCapability =
  | "products.write"
  | "inventory.write"
  | "categories.write"
  | "orders.write"
  | "customers.read"
  | "marketing.write"
  | "content.write"
  | "settings.write"
  | "admins.write"
  | "analytics.read"
  | "requests.write"
  | "reviews.moderate";

export function isStaffRole(role: AppRole | null | undefined): boolean {
  return Boolean(role && STAFF_ROLES.includes(role));
}

export function hasCapability(role: AppRole | null | undefined, cap: StaffCapability): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  if (role === "manager") return cap !== "admins.write";
  if (role === "inventory_manager") {
    return (
      cap === "products.write" ||
      cap === "inventory.write" ||
      cap === "categories.write" ||
      cap === "analytics.read" ||
      cap === "requests.write"
    );
  }
  if (role === "order_manager") {
    return (
      cap === "orders.write" ||
      cap === "customers.read" ||
      cap === "analytics.read" ||
      cap === "requests.write" ||
      cap === "reviews.moderate"
    );
  }
  if (role === "marketing_manager") {
    return cap === "marketing.write" || cap === "content.write" || cap === "analytics.read";
  }
  return false;
}

export function roleLabel(role: AppRole): string {
  return role.replaceAll("_", " ");
}
