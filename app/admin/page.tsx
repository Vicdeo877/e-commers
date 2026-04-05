"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminGetStats } from "@/lib/api";
import { Package, ShoppingBag, Tag, TrendingUp, Users, Clock, Loader2, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

interface Stats {
  products: number;
  orders: number;
  revenue: number;
  coupons: number;
  users: number;
  pending_orders: number;
}

interface RecentOrder {
  id: number;
  order_number: string;
  total: number;
  order_status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminGetStats()
      .then((data) => {
        if (cancelled || !data) return;
        setStats({
          products: data.products ?? 0,
          orders: data.orders ?? 0,
          revenue: Number(data.revenue) || 0,
          coupons: data.coupons ?? 0,
          users: data.users ?? 0,
          pending_orders: data.pending_orders ?? 0,
        });
        setRecentOrders(Array.isArray(data.recent_orders) ? data.recent_orders : []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load dashboard stats");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    { label: "Total Products", value: stats?.products ?? "—", icon: Package, color: "text-blue-600 bg-blue-50" },
    { label: "Total Orders", value: stats?.orders ?? "—", icon: ShoppingBag, color: "text-purple-600 bg-purple-50" },
    { label: "Revenue", value: stats != null ? formatPrice(stats.revenue) : "—", icon: TrendingUp, color: "text-green-600 bg-green-50" },
    { label: "Active Coupons", value: stats?.coupons ?? "—", icon: Tag, color: "text-amber-600 bg-amber-50" },
    { label: "Customers", value: stats?.users ?? "—", icon: Users, color: "text-pink-600 bg-pink-50" },
    { label: "Active orders", value: stats?.pending_orders ?? "—", icon: Clock, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here&apos;s an overview of your store.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span className="text-sm">Loading stats…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {cards.map((card) => (
              <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            ))}
          </div>

          {recentOrders.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Recent orders</h2>
                <Link
                  href="/admin/orders"
                  className="text-sm text-green-600 font-medium hover:underline inline-flex items-center gap-1"
                >
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-100">
                      <th className="pb-2 pr-4 font-medium">Order</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 pr-4 font-medium">Total</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5 pr-4 font-mono text-gray-800">{o.order_number}</td>
                        <td className="py-2.5 pr-4">
                          <span className="inline-block capitalize text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {o.order_status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-medium">{formatPrice(o.total)}</td>
                        <td className="py-2.5 text-gray-500 whitespace-nowrap">
                          {new Date(o.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Manage Products", href: "/admin/products", icon: Package, desc: "Add, edit, or remove products" },
              { label: "Manage Orders", href: "/admin/orders", icon: ShoppingBag, desc: "Update order statuses" },
              { label: "Create Coupon", href: "/admin/coupons", icon: Tag, desc: "Add discount codes" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
