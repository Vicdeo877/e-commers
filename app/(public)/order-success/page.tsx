"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, Truck, ArrowRight, Home } from "lucide-react";
import { getOrderById } from "@/lib/api";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { trackPurchaseEcommerce } from "@/lib/analytics-track";
import { formatPrice } from "@/lib/utils";

interface OrderItem { id: number; name: string; quantity: number; price: number; total: number; }
interface Order {
  id: number; order_number: string; total: number; subtotal: number;
  shipping_amount: number; order_status: string; payment_status: string;
  payment_method: string; shipping_name: string; shipping_phone: string;
  shipping_address: string; shipping_city: string; shipping_state: string;
  shipping_pincode: string; items: OrderItem[]; created_at: string;
}

const STEPS = [
  { label: "Order Placed", icon: CheckCircle2, done: true },
  { label: "Processing", icon: Package, done: false },
  { label: "Shipped", icon: Truck, done: false },
];

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const orderNumber = searchParams.get("order_number");
  const [order, setOrder] = useState<Order | null>(null);
  const { settings } = useSiteSettings();
  const purchaseTracked = useRef(false);

  useEffect(() => {
    if (orderId) {
      getOrderById(Number(orderId))
        .then((o) => setOrder(o))
        .catch(() => {});
    }
  }, [orderId]);

  useEffect(() => {
    if (!order || purchaseTracked.current) return;
    purchaseTracked.current = true;
    const cur = settings?.payment?.currency ?? "INR";
    trackPurchaseEcommerce({
      currency: cur,
      value: order.total,
      transactionId: order.order_number,
      items: (order.items ?? []).map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
    });
  }, [order, settings]);


  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      {/* Success animation */}
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-14 h-14 text-green-600" />
      </div>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Order Confirmed!</h1>
      <p className="text-gray-500 mb-2">
        Thank you for your purchase. Your order has been placed successfully.
      </p>
      <p className="text-green-700 font-bold text-lg mb-8">
        Order #{orderNumber ?? order?.order_number ?? "—"}
      </p>

      {/* Progress tracker */}
      <div className="flex items-center justify-center gap-0 mb-10">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 0 ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs mt-1 font-medium ${i === 0 ? "text-green-600" : "text-gray-400"}`}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-16 h-0.5 mx-1 mb-4 ${i < 1 ? "bg-green-300" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Order summary card */}
      {order && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left mb-6">
          <h2 className="font-bold text-gray-800 mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.name} × {item.quantity}</span>
                <span className="font-medium">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{order.shipping_amount === 0 ? "Free" : formatPrice(order.shipping_amount)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-1"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
          <div className="mt-4 pt-4 border-t text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Delivering to:</p>
            <p>{order.shipping_name} · {order.shipping_phone}</p>
            <p>{order.shipping_address}, {order.shipping_city}, {order.shipping_state} {order.shipping_pincode}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {order && (
          <Link href={`/profile/orders/${order.id}`}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
            <Package className="w-4 h-4" /> Track My Order
          </Link>
        )}
        {!order && (
          <Link href="/profile/orders"
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
            <Package className="w-4 h-4" /> My Orders
          </Link>
        )}

        <Link href="/"
          className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-semibold transition-colors">
          <Home className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-20 text-center text-gray-400">Loading…</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
