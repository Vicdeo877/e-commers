"use client";

import { useEffect, useState } from "react";
import { getOrdersHistory } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Download, ChevronDown, ChevronUp, Package, Navigation } from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoice";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  pending:          "bg-yellow-100 text-yellow-700",
  confirmed:        "bg-blue-100 text-blue-700",
  processing:       "bg-indigo-100 text-indigo-700",
  shipped:          "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered:        "bg-green-100 text-green-700",
  cancelled:        "bg-red-100 text-red-700",
  returned:         "bg-gray-100 text-gray-600",
};

interface OrderItem { id: number; name: string; quantity: number; price: number; total: number; image_main?: string; }
interface Order {
  id: number; order_number: string; created_at: string; total: number;
  subtotal: number; shipping_amount: number; discount_amount?: number;
  order_status: string; payment_status: string; payment_method: string;
  coupon_code?: string; razorpay_payment_id?: string;
  shipping_name?: string; shipping_phone?: string; shipping_address?: string;
  shipping_city?: string; shipping_state?: string; shipping_pincode?: string;
  items?: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    getOrdersHistory()
      .then((d) => setOrders(Array.isArray(d) ? d : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border" />)}</div>;

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-gray-800 text-lg">Order History</h2>
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-25" />
          <p className="font-medium">No orders yet</p>
          <p className="text-sm mt-1">Start shopping to see your orders here.</p>
        </div>
      ) : orders.map((order) => (
        <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Order header */}
          <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-gray-900">#{order.order_number}</p>
              <p className="text-xs text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.order_status] ?? "bg-gray-100 text-gray-600"}`}>
                {order.order_status.replace(/_/g, " ")}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${order.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {order.payment_status}
              </span>
              <span className="font-bold text-gray-900 text-sm">{formatPrice(order.total)}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link
                href={`/profile/orders/${order.id}`}
                className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                <Navigation className="w-3 h-3" /> Track
              </Link>
              {order.order_status === "delivered" && (
                <button
                  onClick={() => generateInvoicePDF(order)}
                  className="flex items-center gap-1 text-xs border border-green-200 text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  <Download className="w-3 h-3" /> Invoice
                </button>
              )}
              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="flex items-center gap-1 text-xs border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg font-medium text-gray-600 transition-colors"
              >
                {expanded === order.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded === order.id ? "Hide" : "Details"}
              </button>
            </div>
          </div>

          {/* Expandable details */}
          {expanded === order.id && (
            <div className="border-t px-5 py-4 bg-gray-50/50">
              {/* Items */}
              {order.items && order.items.length > 0 ? (
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items Ordered</p>
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-sm shrink-0">🍎</div>
                        <span className="text-gray-700">{item.name}</span>
                        <span className="text-gray-400">× {item.quantity}</span>
                      </div>
                      <span className="font-medium text-gray-800">{formatPrice(item.total)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-4">No item details available.</p>
              )}

              {/* Totals */}
              <div className="border-t pt-3 space-y-1 text-xs text-gray-500">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{Number(order.shipping_amount) === 0 ? "FREE" : formatPrice(order.shipping_amount)}</span></div>
                {Number(order.discount_amount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(order.discount_amount!)}</span></div>}
                <div className="flex justify-between font-bold text-gray-900 text-sm pt-1 border-t"><span>Total</span><span>{formatPrice(order.total)}</span></div>
              </div>

              {/* Delivery address */}
              {order.shipping_name && (
                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                  <span className="font-medium">Delivery: </span>
                  {order.shipping_name} · {order.shipping_phone} · {order.shipping_address}, {order.shipping_city} {order.shipping_pincode}
                </div>
              )}

              {order.razorpay_payment_id && (
                <p className="mt-1 text-xs text-gray-400">Payment ID: {order.razorpay_payment_id}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
