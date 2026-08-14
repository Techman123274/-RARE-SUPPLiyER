"use client";

import { StoreHero } from "./StoreHero";
import { CategoryShop } from "./CategoryShop";
import { Marquee } from "@/components/ui/Marquee";
import { FeaturedInventory } from "./FeaturedInventory";
import { LatestInventory } from "./LatestInventory";
import { RequestCta } from "./RequestCta";
import { WhyRare } from "./WhyRare";

export function HomeExperience() {
  return (
    <>
      <StoreHero />
      <Marquee
        items={[
          "RARE SUPPLiyER",
          "REAL SIZES",
          "REAL CONDITION",
          "IN STOCK",
          "SHOP CURRENT INVENTORY",
        ]}
      />
      <FeaturedInventory />
      <CategoryShop />
      <LatestInventory />
      <RequestCta />
      <WhyRare />
    </>
  );
}
