"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock } from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { filterProducts } from "@/lib/products";
import { formatPrice, productHref } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { SafeImage } from "@/components/ui/SafeImage";
import { getActiveCategories, shopHref } from "@/lib/categories";
import { safeParseJSON } from "@/lib/storage";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_KEY = "rare-suppliyer-recent-searches";

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParseJSON<string[]>(localStorage.getItem(RECENT_KEY), []);
  return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
}

function saveRecent(term: string) {
  const next = [term, ...loadRecent().filter((t) => t !== term)].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { products } = useCatalog();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [wasOpen, setWasOpen] = useState(isOpen);
  const categories = useMemo(() => getActiveCategories(products), [products]);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setRecent(loadRecent());
    } else {
      setQuery("");
    }
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return filterProducts(products, { search: query.trim() }).slice(0, 12);
  }, [query, products]);

  const commitSearch = (term: string) => {
    const value = term.trim();
    if (!value) return;
    saveRecent(value);
    setRecent(loadRecent());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-50 inset-x-0 bottom-0 sm:inset-auto sm:top-16 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl"
          >
            <div className="glass-strong overflow-hidden shadow-elevated max-h-[92svh] sm:max-h-[80vh] flex flex-col">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <Search className="w-4 h-4 text-muted flex-shrink-0" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitSearch(query);
                  }}
                  placeholder="Search products..."
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted outline-none text-sm"
                  autoFocus
                  aria-label="Search products"
                />
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-surface-elevated transition-colors min-h-11 min-w-11"
                  aria-label="Close search"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto">
                {query.trim() && results.length === 0 && (
                  <EmptyState
                    title="NO RESULTS FOUND"
                    description={`Nothing matched “${query}”. Try a different search.`}
                  />
                )}

                {results.length > 0 && (
                  <div className="p-2">
                    <p className="px-3 py-2 text-[10px] tracking-[0.18em] text-muted font-mono">
                      {results.length} MATCH{results.length !== 1 ? "ES" : ""}
                    </p>
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        href={productHref(product)}
                        onClick={() => {
                          commitSearch(query);
                          onClose();
                        }}
                        className="flex items-center gap-4 p-3 hover:bg-surface-elevated transition-colors"
                      >
                        <div className="relative w-16 h-16 overflow-hidden studio-well flex-shrink-0 border border-border">
                          <SafeImage
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-contain p-1.5"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] tracking-[0.18em] text-muted uppercase">
                            {product.brand}
                          </p>
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-[10px] text-muted font-mono uppercase">
                            {product.condition}
                          </p>
                        </div>
                        <span className="text-sm font-mono flex-shrink-0">
                          {formatPrice(product.price)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {!query.trim() && (
                  <div className="p-5 space-y-6">
                    {recent.length > 0 && (
                      <div>
                        <p className="text-[10px] tracking-[0.25em] text-muted font-mono mb-3">
                          RECENT SEARCHES
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {recent.map((term) => (
                            <button
                              key={term}
                              onClick={() => setQuery(term)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-border hover:border-accent-secondary/40"
                            >
                              <Clock className="w-3 h-3" />
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] tracking-[0.25em] text-muted font-mono mb-3">
                        CATEGORIES
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((cat) => (
                          <Link
                            key={cat.category}
                            href={shopHref(cat.category)}
                            onClick={onClose}
                            className="px-3 py-3 border border-border hover:border-accent-secondary/40 text-xs tracking-[0.16em]"
                          >
                            {cat.category.toUpperCase()}
                            <span className="block text-[10px] text-muted font-mono mt-1">
                              {cat.count} in stock
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
