"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  ShoppingCart, User, Menu, X, Leaf, Search,
  UserCircle, ShoppingBag, LayoutDashboard, LogOut, Moon, Sun,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { cn, imgUrl } from "@/lib/utils";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import AppImage from "@/components/AppImage";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { count, openDrawer } = useCart();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { settings } = useSiteSettings();
  const siteName = settings?.site_name?.trim() || "BlissFruitz";
  const logoUrl = settings?.logo ?? null;

  /* Close dropdown when clicking outside */
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  /* Close dropdown on route change */
  useEffect(() => {
    setDropdownOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push("/");
  };

  return (
    <header className="glass sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 transition-all duration-300 backdrop-saturate-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl shrink-0">
            {logoUrl ? (
              <AppImage
                src={imgUrl(logoUrl)}
                alt={siteName}
                width={32}
                height={32}
                className="object-contain w-8 h-8 shrink-0"
                placeholderName={siteName}
                placeholderType="product"
              />
            ) : (
              <Leaf className="w-6 h-6 shrink-0" aria-hidden />
            )}
            <span>{siteName}</span>
          </Link>

          {/* ── Search (desktop) ── */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center gap-2 bg-gray-100/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-2 flex-1 max-w-xs focus-within:bg-card focus-within:ring-2 focus-within:ring-green-100 dark:focus-within:ring-green-900/30 transition-all"
          >
            <label htmlFor="nav-desktop-search" className="sr-only">
              Search products
            </label>
            <input
              id="nav-desktop-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for fresh fruits..."
              className="bg-transparent text-sm outline-none flex-1 min-w-0 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
            <button
              type="submit"
              aria-label="Search products"
              className="text-gray-400 hover:text-green-600 transition-colors shrink-0"
            >
              <Search className="w-4 h-4" aria-hidden />
            </button>
          </form>

          {/* ── Desktop Nav Links ── */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors",
                    active
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/10 dark:hover:bg-gray-800"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* ── Right Icons ── */}
          <div className="flex items-center gap-2">

            {/* Cart */}
            <button
              onClick={openDrawer}
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/10 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Open cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => {
                const isDark = document.documentElement.classList.contains("dark");
                if (isDark) {
                  document.documentElement.classList.remove("dark");
                  localStorage.theme = "light";
                } else {
                  document.documentElement.classList.add("dark");
                  localStorage.theme = "dark";
                }
              }}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/10 dark:hover:bg-gray-800 rounded-full transition-colors hidden sm:flex"
              aria-label="Toggle dark mode"
            >
              <Sun className="w-5 h-5 hidden dark:block" />
              <Moon className="w-5 h-5 block dark:hidden" />
            </button>

            {/* Profile / Login */}
            {user ? (
              /* ── Logged-in: profile dropdown ── */
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  type="button"
                  id="nav-profile-menu-button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-sm font-medium",
                    dropdownOpen
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-gray-800 hover:text-primary"
                  )}
                  aria-label={dropdownOpen ? "Close account menu" : "Open account menu"}
                  aria-haspopup="true"
                  aria-controls="nav-profile-dropdown"
                >
                  {/* Avatar circle */}
                  <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {user.full_name?.[0]?.toUpperCase() ?? "U"}
                  </span>
                  <span className="max-w-[90px] truncate">{user.full_name.split(" ")[0]}</span>
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div
                    id="nav-profile-dropdown"
                    className="absolute right-0 top-full mt-2 w-52 bg-card text-foreground rounded-2xl shadow-xl border border-card overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-sm font-semibold truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-800 transition-colors"
                      >
                        <UserCircle className="w-4 h-4 text-gray-400 shrink-0" />
                        My Profile
                      </Link>

                      <Link
                        href="/profile/orders"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-800 transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4 text-gray-400 shrink-0" />
                        My Orders
                      </Link>

                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-800 transition-colors text-green-400"
                        >
                          <LayoutDashboard className="w-4 h-4 shrink-0" />
                          Admin Site
                        </Link>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-700 py-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 transition-colors"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Not logged in: Login button ── */
              <Link
                href="/login"
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-primary/50 hover:text-primary hover:bg-primary/5 dark:hover:bg-gray-800 transition-colors"
              >
                <User className="w-4 h-4" />
                Login
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              id="nav-mobile-menu-button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-primary rounded-full hover:bg-primary/10 dark:hover:bg-gray-800 transition-colors"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-controls="nav-mobile-panel"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div
          id="nav-mobile-panel"
          role="navigation"
          aria-label="Mobile"
          className="md:hidden bg-card dark:bg-gray-950 border-t border-card dark:border-gray-800 px-4 pb-5 pt-3 space-y-2 text-sm font-medium"
        >
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 focus-within:bg-card transition-all rounded-2xl px-4 py-2.5 mb-4">
            <label htmlFor="nav-mobile-search" className="sr-only">
              Search products
            </label>
            <input
              id="nav-mobile-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fruits..."
              className="bg-transparent text-sm outline-none flex-1 text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
            />
            <button type="submit" aria-label="Search products" className="text-gray-400 hover:text-primary shrink-0 p-1">
              <Search className="w-5 h-5" aria-hidden />
            </button>
          </form>

          {/* Nav links */}
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block py-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
              {label}
            </Link>
          ))}

          <div className="border-t border-gray-100 pt-2 mt-2">
            {user ? (
              <>
                {/* User badge */}
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                  <span className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {user.full_name?.[0]?.toUpperCase() ?? "U"}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{user.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>

                <Link href="/profile" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 text-gray-700">
                  <UserCircle className="w-4 h-4 text-gray-400" /> My Profile
                </Link>
                <Link href="/profile/orders" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 text-gray-700">
                  <ShoppingBag className="w-4 h-4 text-gray-400" /> My Orders
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-primary/10 text-primary">
                    <LayoutDashboard className="w-4 h-4" /> Admin Site
                  </Link>
                )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full py-2 px-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 mt-1"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        const isDark = document.documentElement.classList.contains("dark");
                        if (isDark) {
                          document.documentElement.classList.remove("dark");
                          localStorage.theme = "light";
                        } else {
                          document.documentElement.classList.add("dark");
                          localStorage.theme = "dark";
                        }
                      }}
                      className="flex items-center gap-3 w-full py-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                    >
                      <Sun className="w-4 h-4 hidden dark:block" />
                      <Moon className="w-4 h-4 block dark:hidden" />
                      Switch Theme
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200">
                    <User className="w-4 h-4" /> Login / Register
                  </Link>
                  <button
                    onClick={() => {
                      const isDark = document.documentElement.classList.contains("dark");
                      if (isDark) {
                        document.documentElement.classList.remove("dark");
                        localStorage.theme = "light";
                      } else {
                        document.documentElement.classList.add("dark");
                        localStorage.theme = "dark";
                      }
                    }}
                    className="flex items-center gap-3 w-full py-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  >
                    <Sun className="w-4 h-4 hidden dark:block" />
                    <Moon className="w-4 h-4 block dark:hidden" />
                    Switch Theme
                  </button>
                </>
              )}
            </div>
        </div>
      )}
    </header>
  );
}
