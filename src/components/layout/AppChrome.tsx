"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ExperienceShell } from "@/components/experience/ExperienceShell";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <ExperienceShell>
      <Navbar />
      <main className="flex-1 pt-14 pb-20 sm:pb-0">{children}</main>
      <Footer />
      <CartDrawer />
    </ExperienceShell>
  );
}
