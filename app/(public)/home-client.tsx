"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppImage from "@/components/AppImage";
import HeroBannerCarousel from "@/components/HeroBannerCarousel";
import { ArrowRight, Leaf, Star, Truck, ShieldCheck, Sparkles } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { getProducts, getBanners, getOffers, getBlogPosts, getCategories } from "@/lib/api";
import { imgUrl } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  image_main?: string;
  unit?: string;
  stock_quantity?: number;
}
interface Banner {
  id?: number;
  title: string;
  subtitle: string;
  link_url?: string;
  image_path?: string;
  sort_order?: number;
}
interface Offer {
  id?: number;
  title: string;
  description: string;
  coupon_code?: string;
  discount_value: number;
  sort_order?: number;
  highlight?: boolean;
}
interface Blog {
  slug: string;
  title: string;
  excerpt?: string;
  cover_image?: string;
  published_at?: string;
}
interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export default function HomePageClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getProducts()
      .then((d) => setProducts(Array.isArray(d) ? d.slice(0, 8) : []))
      .catch(() => {});
    getBanners("hero")
      .then((d) => setBanners(Array.isArray(d) ? d : []))
      .catch(() => {});
    getOffers()
      .then((d) => setOffers(Array.isArray(d) ? d : []))
      .catch(() => {});
    getBlogPosts()
      .then((d) => setBlogs(Array.isArray(d) ? d : []))
      .catch(() => {});
    getCategories()
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  return (
    <div>
      <HeroBannerCarousel banners={banners} />

      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Shop by category</h2>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-none snap-x">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className="shrink-0 flex flex-col items-center w-[120px] rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-green-300 dark:hover:border-green-800 hover:shadow-xl transition-all duration-300 lg:premium-shadow snap-start"
              >
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 dark:bg-slate-800 mb-3 group">
                  <AppImage
                    src={c.image ? imgUrl(c.image) : null}
                    alt={c.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    placeholderName={c.name}
                    placeholderType="category"
                  />
                </div>
                <span className="text-xs font-bold text-gray-800 dark:text-slate-200 text-center leading-tight uppercase tracking-wide">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-gray-50 dark:border-slate-900">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Featured picks</h2>
            <p className="text-gray-500 dark:text-slate-400 font-medium mt-2">Fresh from the farm to your doorstep</p>
          </div>
          <Link href="/shop" className="text-green-600 font-bold text-sm flex items-center gap-1.5 hover:gap-2 transition-all group">
            View all <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {products.length === 0 && (
          <p className="text-center text-gray-400 py-12">No products yet. Add some in the admin panel.</p>
        )}
      </section>

      {offers.length > 0 && (
        <section className="bg-gradient-to-b from-amber-50/50 to-white dark:from-slate-900 dark:to-slate-950 border-y border-amber-100 dark:border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <h2 className="text-2xl font-extrabold text-amber-950 dark:text-amber-200 mb-8 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-500" /> Offers &amp; deals
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((o) => (
                <div
                  key={o.id ?? o.title}
                  className={`rounded-3xl p-6 transition-all duration-300 ${
                    o.highlight
                      ? "bg-gradient-to-br from-amber-100 to-white dark:from-slate-800 dark:to-slate-900 border-2 border-amber-300 dark:border-amber-900 shadow-xl shadow-amber-200/40 relative overflow-hidden"
                      : "bg-white dark:bg-slate-900 border border-amber-100 dark:border-slate-800 shadow-sm hover:shadow-md"
                  }`}
                >
                  {o.highlight && (
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-400/20 dark:bg-amber-400/10 blur-3xl rounded-full" />
                  )}
                  <div className="flex items-start justify-between gap-2 mb-2 relative z-10">
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{o.title}</p>
                    {o.highlight && (
                      <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-amber-900 dark:text-amber-100 bg-amber-300/60 dark:bg-amber-900/60 px-2.5 py-1 rounded-full">
                        HOT
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-300 mt-2 leading-relaxed relative z-10">{o.description}</p>
                  {o.coupon_code && (
                    <div className="mt-5 flex items-center gap-2 relative z-10">
                      <span className="text-[10px] font-bold text-amber-800/60 dark:text-amber-200/60 uppercase tracking-widest">Use Code:</span>
                      <p className="text-sm font-mono font-bold bg-amber-100 dark:bg-slate-800 text-amber-950 dark:text-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900 shadow-inner">
                        {o.coupon_code}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-3">
              <Truck className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Fast delivery</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Careful packing and quick dispatch</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-3">
              <ShieldCheck className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Quality assured</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Handpicked and freshness checked</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-3">
              <Star className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Loved by families</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Trusted organic produce</p>
          </div>
        </div>
      </section>

      {blogs.length > 0 && (
        <section className="bg-gray-100/80 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">From the blog</h2>
              <Link href="/blog" className="text-green-600 dark:text-green-400 font-semibold text-sm flex items-center gap-1 hover:underline">
                All posts <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {blogs.slice(0, 3).map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group bg-white dark:bg-slate-950 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="h-40 relative">
                    <AppImage
                      src={post.cover_image ? imgUrl(post.cover_image) : null}
                      alt={post.title}
                      fill
                      className="object-cover"
                      placeholderName={post.title}
                      placeholderType="blog"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 line-clamp-2">{post.title}</h3>
                    {post.excerpt && <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 line-clamp-2">{post.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
