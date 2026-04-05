import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Paths that must stay reachable without maintenance checks (avoid recursion / allow login).
 * Admin and upload routes still enforce auth in their handlers (`requireAdmin`, etc.).
 */
function isApiMaintenanceExempt(pathname: string): boolean {
  if (pathname.startsWith("/api/admin")) return true;
  if (pathname.startsWith("/api/upload")) return true;
  if (pathname === "/api/internal/maintenance-gate") return true;
  if (pathname === "/api/content/maintenance") return true;
  /** Needed for first paint + MaintenanceGate; avoids middleware↔self-fetch stalls in dev. */
  if (pathname === "/api/content/site-settings") return true;
  if (pathname === "/api/offers/recommend") return true;
  if (pathname.startsWith("/api/auth/google")) return true;
  if (pathname === "/api/auth/login" || pathname === "/api/auth/logout") return true;
  /** Session bootstrap for AuthProvider / admin layout; must not depend on maintenance-gate latency. */
  if (pathname === "/api/customer/profile") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (isApiMaintenanceExempt(pathname)) {
    return NextResponse.next();
  }

  const origin = request.nextUrl.origin;
  const cookie = request.headers.get("cookie") ?? "";

  type GatePayload = { maintenance_enabled?: boolean; is_admin?: boolean } | null;
  let data: GatePayload = null;
  try {
    const res = await fetch(`${origin}/api/internal/maintenance-gate`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (res.ok) {
      const body = (await res.json()) as { data?: GatePayload };
      data = body?.data ?? null;
    }
  } catch {
    data = null;
  }

  // Fail open if the gate is unreachable (e.g. cold start) so the app does not hard-brick.
  if (!data) {
    return NextResponse.next();
  }

  if (!data.maintenance_enabled) {
    return NextResponse.next();
  }

  if (data.is_admin) {
    return NextResponse.next();
  }

  return NextResponse.json(
    {
      success: false,
      message: "Storefront is temporarily unavailable (maintenance mode).",
    },
    { status: 503 }
  );
}

export const config = {
  matcher: ["/api/:path*"],
};
