"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppImage from "@/components/AppImage";
import { ShoppingCart, Star, ArrowLeft, Truck, Leaf, CreditCard } from "lucide-react";
import { getProduct, getProducts, getReviews, submitReview } from "@/lib/api";
import { imgUrl, formatPrice } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";

interface Product {
  id: number; name: string; slug: string; description?: string; short_description?: string;
  price: number; compare_price?: number; unit?: string; stock_quantity?: number; image_main?: string;
  category?: { name: string; slug: string };
}
interface Review { id: number; guest_name?: string; user?: { full_name: string }; rating: number; title?: string; comment?: string; created_at: string; }

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { add, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [qty, setQty] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", comment: "", guest_name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [buying, setBuying] = useState(false);

  const handleBack = () => {
    if (typeof window === "undefined") {
      router.push("/");
      return;
    }
    const ref = document.referrer;
    const origin = window.location.origin;
    const cameFromOurSite = Boolean(ref && ref.startsWith(origin));
    // Shared / direct opens: no in-app history or external referrer → home
    if (window.history.length <= 1 || !cameFromOurSite) {
      router.push("/");
      return;
    }
    router.back();
  };

  const handleBuyNow = async () => {
    if (!product || cartLoading || buying) return;
    if ((product.stock_quantity ?? 0) <= 0) return;
    setBuying(true);
    try {
      const ok = await add(product.id, qty, { openDrawer: false });
      if (ok) router.push("/checkout");
    } finally {
      setBuying(false);
    }
  };

  useEffect(() => {
    if (!slug) return;
    getProduct(slug)
      .then((d) => { if (d) setProduct(d); else router.push("/shop"); })
      .catch(() => router.push("/shop"));
  }, [slug, router]);

  useEffect(() => {
    if (!product) return;
    getReviews(product.id).then((d) => setReviews(Array.isArray(d) ? d : [])).catch(() => {});
    if (product.category?.slug) {
      getProducts({ category: product.category.slug }).then((prods) => {
        setSimilar(prods.filter((p: Product) => p.id !== product.id).slice(0, 4));
      }).catch(() => {});
    }
  }, [product]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSubmitting(true);
    try {
      await submitReview({ product_id: product.id, ...reviewForm });
      toast.success("Review submitted — pending approval");
      setReviewForm({ rating: 5, title: "", comment: "", guest_name: "" });
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const inStock = (product.stock_quantity ?? 0) > 0;
  const hasDiscount = product.compare_price && Number(product.compare_price) > Number(product.price);
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <button type="button" onClick={handleBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-4 sm:mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-8 md:gap-10">
        {/* Image */}
        <div className="relative h-64 sm:h-96 rounded-2xl overflow-hidden shadow-sm">
          <AppImage
            src={product.image_main ? imgUrl(product.image_main) : null}
            alt={product.name}
            fill
            className="object-cover"
            placeholderName={product.name}
            placeholderType="product"
          />
        </div>

        {/* Details */}
        <div>
          {product.category && (
            <Link href={`/shop?category=${product.category.slug}`} className="text-xs text-green-600 font-medium uppercase tracking-wide">
              {product.category.name}
            </Link>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 mb-2 break-words leading-tight">{product.name}</h1>

          {/* Rating */}
          {reviews.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
              ))}
              <span className="text-sm text-gray-500 ml-1">({reviews.length} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mb-4">
            <span className="text-3xl sm:text-4xl font-extrabold text-green-600">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className="text-xl text-gray-400 line-through">{formatPrice(product.compare_price!)}</span>
            )}
            <span className="text-sm text-gray-500">/ {product.unit ?? "kg"}</span>
          </div>

          {/* Stock */}
          <div className="mb-4">
            {inStock ? (
              <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                In Stock ({product.stock_quantity} available)
              </span>
            ) : (
              <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-medium">Out of Stock</span>
            )}
          </div>

          {product.short_description && (
            <p className="text-gray-600 mb-5 leading-relaxed">{product.short_description}</p>
          )}

          {/* Features */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
            <div className="flex items-center gap-1 whitespace-nowrap"><Leaf className="w-4 h-4 text-green-500 shrink-0" /> Organic</div>
            <div className="flex items-center gap-1 whitespace-nowrap"><Truck className="w-4 h-4 text-green-500 shrink-0" /> Fast Delivery</div>
          </div>

          {/* Quantity + Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Quantity:</span>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white shrink-0">
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">−</button>
                <span className="px-4 py-2 font-medium border-x border-gray-200 min-w-[3rem] text-center">{qty}</span>
                <button type="button" onClick={() => setQty(qty + 1)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">+</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 w-full">
              <button
                type="button"
                onClick={() => add(product.id, qty)}
                disabled={!inStock || cartLoading}
                className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] disabled:bg-gray-300 text-white rounded-xl px-6 py-3.5 font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-green-600/20"
              >
                <ShoppingCart className="w-5 h-5 shrink-0" />
                <span className="text-base whitespace-nowrap">{inStock ? "Add to Cart" : "Out of Stock"}</span>
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!inStock || cartLoading || buying}
                className="w-full bg-gray-900 hover:bg-gray-800 active:scale-[0.98] disabled:bg-gray-300 text-white rounded-xl px-6 py-3.5 font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <CreditCard className="w-5 h-5 shrink-0" />
                <span className="text-base whitespace-nowrap">{buying ? "Wait…" : "Buy now"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mt-10 sm:mt-12 bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm overflow-hidden w-full max-w-full">
          <h2 className="text-xl font-bold text-gray-800 mb-3">About this Product</h2>
          <div className="prose prose-sm sm:prose-base max-w-none text-gray-600 overflow-x-auto w-full" dangerouslySetInnerHTML={{ __html: product.description }} />
        </div>
      )}

      {/* Reviews */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Customer Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-400 text-sm mb-6">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-4 mb-8">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">
                    {r.guest_name ?? r.user?.full_name ?? "Customer"}
                  </span>
                </div>
                {r.title && <p className="font-semibold text-sm text-gray-800">{r.title}</p>}
                {r.comment && <p className="text-sm text-gray-600 mt-0.5">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Review Form */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Write a Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {!user && (
              <input
                type="text"
                placeholder="Your name"
                value={reviewForm.guest_name}
                onChange={(e) => setReviewForm((f) => ({ ...f, guest_name: e.target.value }))}
                className="w-full border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300"
                required
              />
            )}
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600 mr-2">Rating:</span>
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReviewForm((f) => ({ ...f, rating: i + 1 }))}
                >
                  <Star className={`w-5 h-5 ${i < reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Review title"
              value={reviewForm.title}
              onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300"
            />
            <textarea
              placeholder="Share your experience..."
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
              rows={3}
              className="w-full border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300 resize-none"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-semibold text-sm disabled:opacity-60 transition-colors"
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
          </form>
        </div>
      </div>

      {/* Similar Products */}
      {similar.length > 0 && (
        <div className="mt-12 sm:mt-16 mb-8 w-full max-w-full">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Similar Fruits You Might Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
