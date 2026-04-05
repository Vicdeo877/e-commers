"use client";

import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, Wrench } from "lucide-react";

function isLoginPath(path: string) {
  return path === "/login" || path.startsWith("/login/");
}

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const { settings, loading: settingsLoading } = useSiteSettings();

  const cfg =
    settings === null && !settingsLoading
      ? { enabled: false as boolean, message: "" }
      : settings
        ? {
            enabled: Boolean(settings.maintenance?.enabled),
            message:
              settings.maintenance?.message?.trim() ||
              "We're making improvements. Please check back soon.",
          }
        : null;

  /**
   * Do not block the whole storefront on site-settings fetch. A stuck or slow
   * `/api/content/site-settings` would otherwise show only a spinner forever.
   * While loading, fail-open (show the site); once loaded, enforce maintenance.
   */
  if (settingsLoading || cfg === null) {
    return <>{children}</>;
  }

  if (!cfg?.enabled) {
    return <>{children}</>;
  }

  if (isLoginPath(pathname)) {
    return <>{children}</>;
  }

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" aria-hidden />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (user?.role === "admin") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-green-50 to-gray-100">
      <div className="max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-600 text-white mb-6 shadow-lg shadow-green-600/20">
          <Wrench className="w-8 h-8" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">We&apos;ll be right back</h1>
        <p className="text-gray-600 whitespace-pre-wrap mb-8 leading-relaxed">{cfg.message}</p>
        <p className="text-sm text-gray-500 mb-4">Storefront is temporarily unavailable for visitors.</p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 text-sm transition-colors"
        >
          Admin login
        </Link>
      </div>
    </div>
  );
}
