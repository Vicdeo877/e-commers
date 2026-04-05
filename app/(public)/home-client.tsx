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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by category</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className="shrink-0 flex flex-col items-center w-[100px] rounded-2xl border border-gray-100 bg-white p-3 hover:border-green-300 transition-colors shadow-sm"
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 mb-2">
                  <AppImage
                    src={c.image ? imgUrl(c.image) : null}
                    alt={c.name}
                    fill
                    className="object-cover"
                    placeholderName={c.name}
                    placeholderType="category"
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured picks</h2>
            <p className="text-gray-500 text-sm mt-1">Fresh from the farm to your doorstep</p>
          </div>
          <Link href="/shop" className="text-green-600 font-semibold text-sm flex items-center gap-1 hover:underline">
            View all <ArrowRight className="w-4 h-4" />
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
        <section className="bg-amber-50 border-y border-amber-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <h2 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
              <Leaf className="w-5 h-5" /> Offers &amp; deals
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers.map((o) => (
                <div
                  key={o.id ?? o.title}
                  className={`rounded-2xl p-5 shadow-sm transition-all ${
                    o.highlight
                      ? "bg-gradient-to-br from-amber-50 to-white border-2 border-amber-300 ring-2 ring-amber-200/80 shadow-md"
                      : "bg-white border border-amber-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{o.title}</p>
                    {o.highlight && (
                      <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3" aria-hidden />
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{o.description}</p>
                  {o.coupon_code && (
                    <p className="mt-3 text-xs font-mono bg-amber-100 text-amber-900 inline-block px-2 py-1 rounded">
                      {o.coupon_code}
                    </p>
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
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-3">
              <Truck className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900">Fast delivery</h3>
            <p className="text-sm text-gray-500 mt-1">Careful packing and quick dispatch</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-3">
              <ShieldCheck className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900">Quality assured</h3>
            <p className="text-sm text-gray-500 mt-1">Handpicked and freshness checked</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-3">
              <Star className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900">Loved by families</h3>
            <p className="text-sm text-gray-500 mt-1">Trusted organic produce</p>
          </div>
        </div>
      </section>

      {blogs.length > 0 && (
        <section className="bg-gray-100/80 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">From the blog</h2>
              <Link href="/blog" className="text-green-600 font-semibold text-sm flex items-center gap-1 hover:underline">
                All posts <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {blogs.slice(0, 3).map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
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
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600 line-clamp-2">{post.title}</h3>
                    {post.excerpt && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{post.excerpt}</p>}
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
