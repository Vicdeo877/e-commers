"use client";

import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

export default function CartDrawer() {
  const { items, total, drawerOpen, closeDrawer, update, remove, loading } = useCart();

  if (!drawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card shadow-xl z-50 flex flex-col transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-card">
          <h2 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Your Cart
          </h2>
          <button onClick={closeDrawer} className="text-gray-400 hover:text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-gray-500">Your cart is empty</p>
                <Link
                  href="/shop"
                  onClick={closeDrawer}
                  className="inline-block mt-4 text-primary hover:underline text-sm font-medium"
                >
                  Browse products
                </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 items-center py-3 border-b border-card last:border-0">
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                  <div className="w-full h-full bg-gradient-to-br from-green-200 to-emerald-400 flex items-center justify-center text-white font-bold text-lg">
                    {item.name?.[0]?.toUpperCase() ?? "F"}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm line-clamp-1">{item.name}</p>
                  <p className="text-primary font-semibold text-sm">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => update(item.product_id, item.quantity - 1)}
                    disabled={loading || item.quantity <= 1}
                    className="w-7 h-7 rounded-full border border-card flex items-center justify-center text-gray-500 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-40"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => update(item.product_id, item.quantity + 1)}
                    disabled={loading}
                    className="w-7 h-7 rounded-full border border-card flex items-center justify-center text-gray-500 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => remove(item.product_id)}
                    disabled={loading}
                    className="ml-1 text-red-400 hover:text-red-600 disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-card px-5 py-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-bold text-foreground">{formatPrice(total)}</span>
            </div>
            <Link
              href="/cart"
              onClick={closeDrawer}
              className="block w-full bg-primary hover:bg-primary-hover text-white text-center py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-primary/20"
            >
              View Cart & Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
