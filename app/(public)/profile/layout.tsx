"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, MapPin, ShoppingBag, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/profile/addresses", label: "Addresses", icon: MapPin },
  { href: "/profile/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/profile/password", label: "Password", icon: Lock },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Account</h1>
      <div className="grid md:grid-cols-4 gap-6">
        <nav className="md:col-span-1 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="md:col-span-3">{children}</div>
      </div>
    </div>
  );
}
