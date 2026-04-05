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

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/product/${product.slug}`} className="block relative h-48 overflow-hidden">
        <AppImage
          src={product.image_main ? imgUrl(product.image_main) : null}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          placeholderName={product.name}
          placeholderType="product"
        />
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full z-10">
            SALE
          </span>
        )}
        {!inStock && (
          <span className="absolute top-2 right-2 bg-gray-600 text-white text-xs px-2 py-0.5 rounded-full z-10">
            Out of stock
          </span>
        )}
      </Link>
      <div className="p-4">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-semibold text-gray-800 hover:text-green-600 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-400 mb-2">{product.unit ?? "kg"}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-green-600 text-lg">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className="ml-2 text-xs text-gray-400 line-through">
                {formatPrice(product.compare_price!)}
              </span>
            )}
          </div>
          <button
            onClick={() => add(product.id)}
            disabled={!inStock || loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-full p-2 transition-colors"
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
