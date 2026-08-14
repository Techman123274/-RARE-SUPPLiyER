import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { shopHref } from "@/lib/categories";

const shopLinks = [
  { href: "/shop", label: "SHOP" },
  { href: shopHref("Sneakers"), label: "SNEAKERS" },
  { href: shopHref("Clothing"), label: "CLOTHING" },
  { href: shopHref("Accessories"), label: "ACCESSORIES" },
  { href: shopHref("Other"), label: "OTHER" },
];

const companyLinks = [
  { href: "/request", label: "REQUEST" },
  { href: "/about", label: "ABOUT" },
  { href: "/account", label: "ACCOUNT" },
  { href: "/contact", label: "CONTACT" },
];

const policyLinks = [
  { href: "/shipping", label: "SHIPPING" },
  { href: "/returns", label: "RETURNS" },
  { href: "/privacy", label: "PRIVACY" },
  { href: "/terms", label: "TERMS" },
];

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto bg-surface/40">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-8">
          <div className="col-span-2 md:col-span-1">
            <Logo variant="footer" />
            <p className="mt-4 text-[10px] tracking-[0.28em] text-muted font-mono">
              ONLINE RESALE STORE
            </p>
            <p className="mt-4 text-sm text-muted leading-relaxed max-w-xs">
              Premium sneakers, clothing and accessories sourced for resale.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] tracking-[0.22em] font-medium mb-4 text-muted">SHOP</h4>
            <ul className="space-y-2.5">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs tracking-[0.14em] text-muted hover:text-accent-secondary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] tracking-[0.22em] font-medium mb-4 text-muted">COMPANY</h4>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs tracking-[0.14em] text-muted hover:text-accent-secondary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] tracking-[0.22em] font-medium mb-4 text-muted">POLICIES</h4>
            <ul className="space-y-2.5">
              {policyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs tracking-[0.14em] text-muted hover:text-accent-secondary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] tracking-[0.18em] text-muted font-mono">
            © {new Date().getFullYear()} RARE SUPPLiyER
          </p>
          <p className="text-[10px] tracking-[0.18em] text-muted/70 font-mono">
            REAL SIZES · REAL CONDITION
          </p>
        </div>
      </div>
    </footer>
  );
}
