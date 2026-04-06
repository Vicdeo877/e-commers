"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, Package, Cog, Truck, MapPin, Home,
  ArrowLeft, Download, Phone, MessageCircle, Clock,
} from "lucide-react";
import { getOrderById } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/invoice";

/* ── Types ── */
interface OrderItem { id: number; name: string; quantity: number; price: number; total: number; }
interface Order {
  id: number; order_number: string; total: number; subtotal: number;
  shipping_amount: number; discount_amount?: number;
  order_status: string; payment_status: string; payment_method: string;
  coupon_code?: string; razorpay_payment_id?: string; tracking_number?: string;
  shipping_name?: string; shipping_phone?: string; shipping_address?: string;
  shipping_city?: string; shipping_state?: string; shipping_pincode?: string;
  location_link?: string;
  items?: OrderItem[]; created_at: string; updated_at?: string;
}

/* ── Step config ── */
const STEPS = [
  { key: "pending",          label: "Order Placed",      Icon: CheckCircle2, desc: "Order received",        loc: "Online" },
  { key: "confirmed",        label: "Confirmed",          Icon: CheckCircle2, desc: "Order confirmed",       loc: "Warehouse" },
  { key: "processing",       label: "Processing",         Icon: Cog,          desc: "Being packed",          loc: "Warehouse" },
  { key: "shipped",          label: "Shipped",            Icon: Truck,        desc: "On the way",            loc: "In Transit" },
  { key: "out_for_delivery", label: "Out for Delivery",   Icon: Truck,        desc: "Out for delivery",      loc: "Near You" },
  { key: "delivered",        label: "Delivered",          Icon: Home,         desc: "Delivered successfully",loc: "Your Door" },
];

const STEP_ORDER = STEPS.map((s) => s.key);
const CANCELLED_STATUSES = ["cancelled", "returned"];

function getStepIndex(status: string) {
  const idx = STEP_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function formatTs(ts: string) {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
      " - " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return ts; }
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getOrderById(Number(id))
      .then((o) => { if (o) setOrder(o); else router.push("/profile/orders"); })
      .catch(() => router.push("/profile/orders"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Loading order details…</p>
      </div>
    </div>
  );

  if (!order) return null;

  const isCancelled = CANCELLED_STATUSES.includes(order.order_status);
  const currentStep = isCancelled ? -1 : getStepIndex(order.order_status);
  const isDelivered = order.order_status === "delivered";

  /* Build timeline from current step backwards */
  const timelineEvents = STEPS.slice(0, currentStep + 1).reverse().map((step, i) => ({
    label: step.label,
    desc: i === 0 ? "Current status" : step.desc,
    loc: step.loc,
    time: i === 0 ? order.updated_at ?? order.created_at : order.created_at,
    active: i === 0,
  }));

  if (isCancelled) {
    timelineEvents.unshift({
      label: order.order_status === "returned" ? "Returned" : "Cancelled",
      desc: "Order was cancelled",
      loc: "—",
      time: order.updated_at ?? order.created_at,
      active: true,
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </button>

      <div className="bg-card rounded-2xl border border-card shadow-sm overflow-hidden">
        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-card">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">Order Tracking</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Tracking ID: <span className="font-semibold text-gray-800">{order.order_number}</span>
                {order.tracking_number && (
                  <span className="ml-2 text-blue-600">· {order.tracking_number}</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Estimated Delivery</p>
              {isDelivered ? (
                <p className="text-sm font-bold text-green-600">Delivered ✓</p>
              ) : isCancelled ? (
                <p className="text-sm font-bold text-red-500">Cancelled</p>
              ) : (
                <p className="text-sm font-bold text-green-600">Will be updated soon</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Visual Step Tracker ── */}
        <div className="px-6 py-8">
          {isCancelled ? (
            <div className="flex items-center justify-center gap-3 py-4 bg-red-50 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-500 text-xl">✕</span>
              </div>
              <div>
                <p className="font-bold text-red-700 capitalize">{order.order_status}</p>
                <p className="text-sm text-red-400">This order was {order.order_status}</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* connector line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 mx-8" />
              {/* completed portion */}
              <div
                className="absolute top-5 left-0 h-0.5 bg-green-500 mx-8 transition-all duration-700"
                style={{ width: `${currentStep === 0 ? 0 : (currentStep / (STEPS.length - 1)) * 100}%` }}
              />

              {/* Steps */}
              <div className="relative flex justify-between">
                {STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-1.5" style={{ width: `${100 / STEPS.length}%` }}>
                      {/* Circle */}
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        done
                          ? "bg-green-500 border-green-500 text-white shadow-md shadow-green-200"
                          : "bg-white border-gray-300 text-gray-400"
                      }`}>
                        {done ? (
                          i < currentStep ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <step.Icon className={`w-4 h-4 ${active ? "animate-pulse" : ""}`} />
                          )
                        ) : (
                          <step.Icon className="w-4 h-4" />
                        )}
                        {/* pulse ring for active */}
                        {active && (
                          <span className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-50" />
                        )}
                      </div>
                      {/* Label */}
                      <span className={`text-xs text-center font-medium leading-tight ${done ? "text-green-700" : "text-gray-400"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Timeline Log ── */}
        <div className="px-6 pb-5 space-y-4">
          {timelineEvents.map((ev, i) => (
            <div key={i} className="flex gap-4 items-start">
              {/* dot */}
              <div className="flex flex-col items-center pt-1 shrink-0">
                <div className={`w-3 h-3 rounded-full border-2 ${ev.active ? "bg-green-500 border-green-500" : "bg-gray-200 border-gray-300"}`} />
                {i < timelineEvents.length - 1 && <div className="w-0.5 h-8 bg-gray-200 mt-1" />}
              </div>
              {/* content */}
              <div className="flex-1 min-w-0 -mt-0.5">
                <p className={`font-semibold text-sm ${ev.active ? "text-foreground" : "text-gray-500"}`}>{ev.label}</p>
                <p className={`text-xs ${ev.active ? "text-primary" : "text-gray-400"}`}>{ev.desc}</p>
                {ev.loc && ev.loc !== "—" && (
                  <p className={`text-xs ${ev.active ? "text-gray-500" : "text-gray-400"}`}>Location: {ev.loc}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTs(ev.time)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Order Items ── */}
        {order.items && order.items.length > 0 && (
          <div className="mx-6 mb-5 border border-card rounded-2xl overflow-hidden">
            <div className="bg-gray-50/50 dark:bg-gray-800/30 px-4 py-2 border-b border-card">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Items in this order</p>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {order.items.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-sm">🍎</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatPrice(item.total)}</span>
                </div>
              ))}
            </div>
            <div className="bg-gray-50/50 dark:bg-gray-800/30 px-4 py-2 border-t border-card flex justify-between text-sm">
              <span className="text-gray-500">Order Total</span>
              <span className="font-bold text-foreground">{formatPrice(order.total)}</span>
            </div>
          </div>
        )}

        {/* ── Delivery Address ── */}
        {order.shipping_name && (
          <div className="mx-6 mb-5 flex items-start gap-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl px-4 py-3">
            <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Delivery Address</p>
              <p className="text-sm text-foreground">
                {order.shipping_address}, {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}
              </p>
                {order.location_link && (
                  <a href={order.location_link} target="_blank" rel="noopener noreferrer" 
                     className="inline-flex items-center gap-1.5 text-xs text-primary font-bold mt-1.5 hover:underline decoration-dotted transition-all">
                    View Pinned Location on Map →
                  </a>
                )}
              <p className="text-xs text-gray-400 mt-1.5">{order.shipping_name} · {order.shipping_phone}</p>
            </div>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="px-6 pb-6 flex flex-wrap gap-2 justify-center">
          {isDelivered && (
            <button
              onClick={() => generateInvoicePDF(order)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-green-500 text-green-700 hover:bg-green-50 text-sm font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> View Bill
            </button>
          )}
          <Link
            href="/profile/orders"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors"
          >
            <Package className="w-3.5 h-3.5" /> Back to Orders
          </Link>
          <Link
            href="/contact"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors"
          >
            <Phone className="w-3.5 h-3.5" /> Contact Support
          </Link>
          {order.shipping_phone && (
            <a
              href={`https://wa.me/91${order.shipping_phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-green-400 bg-green-50 text-green-700 hover:bg-green-100 text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
