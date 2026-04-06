"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminGetStats } from "@/lib/api";
import { Package, ShoppingBag, Tag, TrendingUp, Users, Clock, Loader2, ArrowRight, Mail } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

interface Stats {
  products: number;
  orders: number;
  revenue: number;
  coupons: number;
  users: number;
  pending_orders: number;
  pending_messages?: number;
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
          pending_messages: data.pending_messages ?? 0,
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
    { label: "Total Products", value: stats?.products ?? "—", icon: Package, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
    { label: "Total Orders", value: stats?.orders ?? "—", icon: ShoppingBag, color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10" },
    { label: "Revenue", value: stats != null ? formatPrice(stats.revenue) : "—", icon: TrendingUp, color: "text-green-600 bg-green-50 dark:bg-green-500/10" },
    { label: "Active Coupons", value: stats?.coupons ?? "—", icon: Tag, color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10" },
    { label: "Customers", value: stats?.users ?? "—", icon: Users, color: "text-pink-600 bg-pink-50 dark:bg-pink-500/10" },
    { label: "Active orders", value: stats?.pending_orders ?? "—", icon: Clock, color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
    { label: "Inquiries", value: stats?.pending_messages ?? "—", icon: Mail, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10", href: "/admin/messages" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1 italic">Welcome back! Here's a real-time summary of your store's performance.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span className="text-sm">Loading stats…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-10">
            {cards.map((card) => (
              card.href ? (
                <Link key={card.label} href={card.href} className="bg-card rounded-3xl border border-card shadow-sm p-6 transition-all hover:shadow-md group">
                   <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{card.label}</p>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${card.color}`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{card.value}</p>
                </Link>
              ) : (
                <div key={card.label} className="bg-card rounded-3xl border border-card shadow-sm p-6 transition-all hover:shadow-md group">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{card.label}</p>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${card.color}`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{card.value}</p>
                </div>
              )
            ))}
          </div>

          {recentOrders.length > 0 && (
            <div className="bg-card rounded-3xl border border-card shadow-sm p-8 mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-foreground text-lg">Recent Transactions</h2>
                <Link
                  href="/admin/orders"
                  className="text-[10px] text-primary font-bold hover:text-primary-hover uppercase tracking-widest inline-flex items-center gap-1.5 transition-colors"
                >
                  Explore All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-gray-400 border-b border-card">
                      <th className="pb-4 pr-6 text-[10px] font-bold uppercase tracking-widest">Order ID</th>
                      <th className="pb-4 pr-6 text-[10px] font-bold uppercase tracking-widest">Flow Status</th>
                      <th className="pb-4 pr-6 text-[10px] font-bold uppercase tracking-widest text-right">Total Amount</th>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-right">Time & Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card">
                    {recentOrders.map((o) => (
                      <tr key={o.id} className="group hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-4 pr-6 font-mono text-xs font-bold text-foreground">{o.order_number}</td>
                        <td className="py-4 pr-6">
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-card group-hover:border-primary/20 transition-colors">
                                {o.order_status}
                            </span>
                        </td>
                        <td className="py-4 pr-6 font-bold text-foreground text-right">{formatPrice(o.total)}</td>
                        <td className="py-4 text-gray-400 text-xs text-right italic whitespace-nowrap">
                          {new Date(o.created_at).toLocaleString("en-IN", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { label: "Manage Products", href: "/admin/products", icon: Package, desc: "Catalog management control" },
              { label: "Manage Orders", href: "/admin/orders", icon: ShoppingBag, desc: "Fullfillment & tracking" },
              { label: "Create Coupon", href: "/admin/coupons", icon: Tag, desc: "Discount & loyalty tools" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="bg-card rounded-3xl border border-card shadow-sm p-6 hover:shadow-xl hover:-translate-y-1 transition-all flex items-start gap-5 group"
              >
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/5 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary transition-colors">
                  <item.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm uppercase tracking-wide group-hover:text-primary transition-colors">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-1 italic leading-relaxed">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
