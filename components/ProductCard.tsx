"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice, imgUrl } from "@/lib/utils";
import AppImage from "./AppImage";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  compare_price?: number | string | null;
  image_main?: string | null;
  unit?: string;
  stock_quantity?: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const { add, loading } = useCart();
  const inStock = (product.stock_quantity ?? 1) > 0;
  const hasDiscount =
    product.compare_price && Number(product.compare_price) > Number(product.price);
  
  const discountPercent = hasDiscount 
    ? Math.round(((Number(product.compare_price) - Number(product.price)) / Number(product.compare_price)) * 100)
    : 0;

  return (
    <div className="group bg-card rounded-3xl shadow-sm border border-card overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 premium-shadow flex flex-col h-full">
      <Link href={`/product/${product.slug}`} className="block relative h-40 sm:h-52 overflow-hidden bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
        <AppImage
          src={product.image_main ? imgUrl(product.image_main) : null}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          placeholderName={product.name}
          placeholderType="product"
        />
        {hasDiscount && (
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            <div className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-lg flex items-center justify-center uppercase tracking-tighter">
              Save
            </div>
            <div className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center justify-center uppercase tracking-tighter border border-amber-500/20">
              {discountPercent}% OFF
            </div>
          </div>
        )}
        {!inStock && (
          <span className="absolute top-2 right-2 bg-gray-600 text-white text-xs px-2 py-0.5 rounded-full z-10">
            Out of stock
          </span>
        )}
      </Link>
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <Link href={`/product/${product.slug}`} className="block mb-1.5">
          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-[13px] sm:text-base leading-tight">
            {product.name}
          </h3>
        </Link>
        <p className="text-[10px] font-bold text-gray-400 mb-auto uppercase tracking-wider">{product.unit || "Unit"}</p>
        
        <div className="flex items-center justify-between gap-1.5 mt-auto pt-2">
          <div className="flex flex-col min-w-0 leading-tight">
            {hasDiscount && (
              <span className="text-[10px] sm:text-xs text-gray-400 line-through decoration-red-400/40 mb-0.5 opacity-80 truncate">
                {formatPrice(product.compare_price!)}
              </span>
            )}
            <span className="font-black text-primary text-sm sm:text-lg tracking-tight truncate leading-none">
              {formatPrice(product.price)}
            </span>
          </div>
          
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); void add(product.id); }}
            disabled={!inStock || loading}
            className="premium-gradient-emerald hover:scale-105 disabled:bg-gray-300 text-white rounded-xl p-2 sm:p-2.5 transition-all duration-300 active:scale-90 flex items-center justify-center shadow-md shrink-0 mb-0.5 mr-0.5"
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
