"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import AppImage from "@/components/AppImage";
import { getProducts, getCategories } from "@/lib/api";
import { imgUrl } from "@/lib/utils";
import { Search, SlidersHorizontal } from "lucide-react";

interface Product { id: number; name: string; slug: string; price: number; compare_price?: number; image_main?: string; unit?: string; stock_quantity?: number; }
interface Category { id: number; name: string; slug: string; image?: string; }

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "";

  useEffect(() => {
    getCategories().then((d) => setCategories(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (sort) params.sort = sort;
    
    // API uses category_id; find it from slug
    if (category && categories.length) {
      const found = categories.find((c) => c.slug === category);
      if (found) params.category_id = String(found.id);
    }
    getProducts(params)
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [q, category, sort, categories]);

  const setParam = (key: string, val: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (val) p.set(key, val); else p.delete(key);
    router.push(`/shop?${p.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">Shop All Fruits</h1>

      {categories.length > 0 && (
        <div className="mb-6 -mx-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Browse by category</p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
            <Link
              href="/shop"
              className={`shrink-0 flex flex-col items-center w-[88px] rounded-2xl border p-2 transition-colors ${
                !category ? "border-primary bg-primary/10 shadow-sm" : "border-card bg-card hover:border-primary/30"
              }`}
            >
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 mb-1 ring-1 ring-black/5">
                <AppImage src={null} alt="All" width={56} height={56} fit="cover" placeholderName="All" placeholderType="category" />
              </div>
              <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">All</span>
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className={`shrink-0 flex flex-col items-center w-[88px] rounded-2xl border p-2 transition-colors ${
                  category === c.slug ? "border-primary bg-primary/10 shadow-sm" : "border-card bg-card hover:border-primary/30"
                }`}
              >
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-1 ring-1 ring-black/5">
                  <AppImage
                    src={c.image ? imgUrl(c.image) : null}
                    alt={c.name}
                    width={56}
                    height={56}
                    fit="cover"
                    placeholderName={c.name}
                    placeholderType="category"
                  />
                </div>
                <span className="text-[11px] font-medium text-foreground text-center leading-tight line-clamp-2">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-card shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setParam("q", e.target.value)}
            placeholder="Search fruits..."
            className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-gray-500"
          />
        </div>

        {/* Category */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-500" />
          <select
            value={category}
            onChange={(e) => setParam("category", e.target.value)}
            className="text-sm bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2 outline-none text-foreground"
          >
            <option value="" className="dark:bg-gray-900">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug} className="dark:bg-gray-900">{c.name}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="text-sm bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2 outline-none text-foreground"
        >
          <option value="" className="dark:bg-gray-900">Default</option>
          <option value="price_asc" className="dark:bg-gray-900">Price: Low to High</option>
          <option value="price_desc" className="dark:bg-gray-900">Price: High to Low</option>
          <option value="name_asc" className="dark:bg-gray-900">Name A-Z</option>
        </select>

        {(q || category || sort) && (
          <button
            onClick={() => router.push("/shop")}
            className="text-sm text-red-500 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-56 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-2xl mb-2">🍃</p>
          <p>No products found. Try a different search.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{products.length} products</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
