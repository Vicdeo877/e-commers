"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard, ShoppingBag, Package, Tag, Image, FileText,
  Star, Leaf, LogOut, ChevronRight, Loader2, Users, UserCog, Settings, Percent,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatBot } from "@/components/ChatBot";
import ThemeRoot from "@/components/ThemeRoot";
import { useState } from "react";
import api from "@/lib/api";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/admins", label: "Admin users", icon: UserCog },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/content/banners", label: "Banners", icon: Image },
  { href: "/admin/content/offers", label: "Offers & deals", icon: Percent },
  { href: "/admin/content/blog", label: "Blog Posts", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  /* Poll for new orders every 30 seconds */
  useEffect(() => {
    if (user?.role !== "admin") return;
    
    const checkNewOrders = async () => {
        try {
            const res = await api.get("/admin/orders?status=pending&per_page=1");
            const count = res.data?.pagination?.total ?? 0;
            setNewOrdersCount(count);
        } catch (e) {
            console.error("Failed to fetch new orders count", e);
        }
    };

    checkNewOrders();
    const interval = setInterval(checkNewOrders, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/login");
      else if (user.role !== "admin") router.replace("/");
    }
  }, [user, loading, router]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  /* ── Not authenticated / not admin — show redirect message ── */
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-gray-300 shrink-0 fixed inset-y-0 left-0 z-30">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">BlissFruitz</p>
            <p className="text-xs text-green-400 font-medium">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.label === "Orders" && newOrdersCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse mr-1">
                    {newOrdersCount}
                  </span>
                )}
                {active && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user.full_name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={async () => { await logout(); router.push("/"); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-gray-900 text-white flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm flex-1">Admin Panel</span>
        <div className="flex gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive(item) ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="flex-1 md:ml-64 pt-14 md:pt-0 min-h-screen">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </div>

    </div>
  );
}
