import type { Metadata } from "next";
import { Oswald, Manrope, JetBrains_Mono } from "next/font/google";
import { CatalogProvider } from "@/context/CatalogContext";
import { CartProvider } from "@/context/CartContext";
import { FlyToCartProvider } from "@/context/FlyToCartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { AppChrome } from "@/components/layout/AppChrome";
import { SITE } from "@/content/site";
import "./globals.css";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  icons: {
    icon: "/assets/logo.png",
    apple: "/assets/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${oswald.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex flex-col min-h-screen">
        <CatalogProvider>
          <AuthProvider>
            <CartProvider>
              <FlyToCartProvider>
                <WishlistProvider>
                  <AppChrome>{children}</AppChrome>
                </WishlistProvider>
              </FlyToCartProvider>
            </CartProvider>
          </AuthProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
