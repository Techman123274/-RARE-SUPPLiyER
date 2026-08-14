"use client";

import { useState } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  ProductCategory,
  ProductCondition,
  ProductFilters,
  SortOption,
  AvailabilityFilter,
} from "@/lib/types";
import { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS } from "@/lib/types";
import { cn, getUniqueSizes } from "@/lib/utils";

const categories: (ProductCategory | "All")[] = ["All", ...PRODUCT_CATEGORIES];
const conditions: (ProductCondition | "All")[] = ["All", ...PRODUCT_CONDITIONS];

const availabilityOptions: { value: AvailabilityFilter; label: string }[] = [
  { value: "All", label: "All" },
  { value: "in_stock", label: "In Stock" },
];

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest Added" },
  { value: "oldest", label: "Oldest Added" },
  { value: "price-asc", label: "Price Low → High" },
  { value: "price-desc", label: "Price High → Low" },
  { value: "name-asc", label: "Name A → Z" },
];

interface ProductFiltersBarProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  brands: string[];
  sizes: string[];
  resultCount: number;
  hideSortOnDesktop?: boolean;
}

function hasActive(filters: ProductFilters) {
  return Boolean(
    (filters.category && filters.category !== "All") ||
      (filters.brand && filters.brand !== "All") ||
      (filters.size && filters.size !== "All") ||
      (filters.condition && filters.condition !== "All") ||
      (filters.availability && filters.availability !== "All") ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined
  );
}

export function ProductFiltersBar({
  filters,
  onChange,
  brands,
  sizes,
  resultCount,
}: ProductFiltersBarProps) {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draft, setDraft] = useState<ProductFilters>(filters);

  const update = (partial: Partial<ProductFilters>) => {
    onChange({ ...filters, ...partial });
  };

  const clearFilters = () => {
    onChange({ sort: filters.sort });
    setDraft({ sort: filters.sort });
  };

  const openMobile = () => {
    setDraft(filters);
    setMobileOpen(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => update({ category: cat })}
            className={cn(
              "px-3 py-2 text-[10px] tracking-[0.18em] uppercase border transition-colors",
              (filters.category || "All") === cat
                ? "border-accent-secondary text-accent-secondary"
                : "border-border text-muted hover:text-foreground hover:border-foreground/30"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDesktopOpen((v) => !v)}
            className="hidden lg:inline-flex items-center gap-2 px-3 py-2 text-[10px] tracking-[0.18em] border border-border hover:border-accent-secondary/40 transition-colors"
            aria-expanded={desktopOpen}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            FILTERS
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", desktopOpen && "rotate-180")} />
          </button>
          <button
            onClick={openMobile}
            className="lg:hidden inline-flex items-center gap-2 px-3 py-2 text-[10px] tracking-[0.18em] border border-border"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            FILTERS
            {hasActive(filters) && <span className="w-1.5 h-1.5 bg-accent-secondary rounded-full" />}
          </button>
          {hasActive(filters) && (
            <button
              onClick={clearFilters}
              className="text-[10px] tracking-[0.16em] text-muted hover:text-foreground"
            >
              CLEAR
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {desktopOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="hidden lg:block overflow-hidden mb-6"
          >
            <div className="glass p-5">
              <FilterFields filters={filters} update={update} brands={brands} sizes={sizes} compact />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[min(400px,92vw)] glass-strong flex flex-col lg:hidden"
              role="dialog"
              aria-label="Filters"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="text-xs tracking-[0.22em] font-display">FILTERS</h3>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 hover:bg-surface-elevated min-h-11 min-w-11"
                  aria-label="Close filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <FilterFields
                  filters={draft}
                  update={(partial) => setDraft((prev) => ({ ...prev, ...partial }))}
                  brands={brands}
                  sizes={sizes}
                />
              </div>
              <div className="p-5 border-t border-border space-y-2">
                <button
                  onClick={() => {
                    onChange(draft);
                    setMobileOpen(false);
                  }}
                  className="w-full py-3 bg-foreground text-background text-[11px] tracking-[0.2em]"
                >
                  APPLY FILTERS
                </button>
                <button
                  onClick={() => {
                    const cleared = { sort: filters.sort };
                    setDraft(cleared);
                    onChange(cleared);
                    setMobileOpen(false);
                  }}
                  className="w-full py-3 border border-border text-[11px] tracking-[0.2em] text-muted hover:text-foreground"
                >
                  CLEAR FILTERS
                </button>
                <p className="text-center text-[10px] text-muted font-mono">
                  {resultCount} ITEM{resultCount !== 1 ? "S" : ""}
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterFields({
  filters,
  update,
  brands,
  sizes,
  compact = false,
}: {
  filters: ProductFilters;
  update: (partial: Partial<ProductFilters>) => void;
  brands: string[];
  sizes: string[];
  compact?: boolean;
}) {
  const uniqueSizes = getUniqueSizes(sizes);

  return (
    <div className={cn(compact ? "grid grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-5")}>
      <FilterGroup label="CATEGORY">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <FilterChip
              key={cat}
              active={(filters.category || "All") === cat}
              onClick={() => update({ category: cat })}
            >
              {cat}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="BRAND">
        <select
          value={filters.brand || "All"}
          onChange={(e) => update({ brand: e.target.value })}
          className="field-input py-2"
        >
          <option value="All">All Brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup label="SIZE">
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={!filters.size || filters.size === "All"}
            onClick={() => update({ size: "All" })}
          >
            All
          </FilterChip>
          {uniqueSizes.map((s) => (
            <FilterChip
              key={`size-${s}`}
              active={filters.size === s}
              onClick={() => update({ size: s })}
            >
              {s}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="CONDITION">
        <div className="flex flex-wrap gap-2">
          {conditions.map((c) => (
            <FilterChip
              key={c}
              active={(filters.condition || "All") === c}
              onClick={() => update({ condition: c })}
            >
              {c}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="AVAILABILITY">
        <div className="flex flex-wrap gap-2">
          {availabilityOptions.map((opt) => (
            <FilterChip
              key={opt.value}
              active={(filters.availability || "All") === opt.value}
              onClick={() => update({ availability: opt.value })}
            >
              {opt.label}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="PRICE">
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              update({ minPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            className="field-input py-2"
          />
          <span className="text-muted">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            className="field-input py-2"
          />
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] tracking-[0.22em] text-muted uppercase mb-2.5">{label}</h4>
      {children}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-[11px] border transition-colors",
        active
          ? "border-accent-secondary text-accent-secondary"
          : "border-border text-muted hover:border-foreground/30 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
