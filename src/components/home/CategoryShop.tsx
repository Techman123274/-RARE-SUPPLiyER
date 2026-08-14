"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/ui/FadeIn";
import { SafeImage } from "@/components/ui/SafeImage";
import { useCatalog } from "@/context/CatalogContext";
import { getActiveCategories, shopHref } from "@/lib/categories";
import { PRODUCT_CATEGORIES } from "@/lib/types";
import { EASE } from "@/lib/motion";

export function CategoryShop() {
  const { products } = useCatalog();
  const live = getActiveCategories(products);
  const categories = PRODUCT_CATEGORIES.map((name) => {
    const found = live.find((c) => c.category === name);
    return found ?? { category: name, count: 0, image: null };
  });

  return (
    <section className="py-14 sm:py-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="text-[10px] tracking-[0.32em] text-muted font-mono mb-2">BROWSE</p>
          <h2 className="text-2xl sm:text-4xl font-display tracking-[0.08em] mb-8">
            SHOP BY CATEGORY
          </h2>
        </FadeIn>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((card, i) => (
            <motion.div
              key={card.category}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.05, duration: 0.45, ease: EASE.premium }}
            >
              <Link
                href={shopHref(card.category)}
                className="group relative block overflow-hidden border border-border glow-border studio-well aspect-[4/5]"
              >
                {card.image && (
                  <SafeImage
                    src={card.image}
                    alt=""
                    fill
                    className="object-cover opacity-50 transition-transform duration-700 ease-premium group-hover:scale-105"
                    sizes="(max-width:1024px) 50vw, 25vw"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent" />
                <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end">
                  <p className="text-[10px] tracking-[0.24em] text-muted font-mono mb-1 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                    {card.count} IN STOCK
                  </p>
                  <h3 className="text-lg sm:text-2xl font-display tracking-[0.1em] group-hover:text-accent-secondary transition-colors duration-300">
                    {card.category.toUpperCase()}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
