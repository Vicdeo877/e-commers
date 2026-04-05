import { NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
} from "@/lib/server/google-oauth";
import { publicOriginFromRequest, safeNextPath } from "@/lib/server/app-origin";

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 600,
  secure: process.env.NODE_ENV === "production",
};

/**
 * Starts Google OAuth: sets CSRF state cookie and redirects to Google.
 * Query: `next` — optional path to redirect after login (same-origin path only).
 */
export async function GET(req: Request) {
  try {
    const requestOrigin = publicOriginFromRequest(req);
    const hasClient =
      Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID) &&
      Boolean(process.env.GOOGLE_CLIENT_SECRET);
    if (!hasClient) {
      const ref = req.headers.get("referer") ?? "";
      let path = "/login";
      try {
        const p = new URL(ref).pathname;
        if (p === "/register" || p.startsWith("/register/")) path = "/register";
      } catch {
        /* ignore */
      }
      const target = new URL(path, requestOrigin);
      target.searchParams.set("error", "oauth_config");
      return NextResponse.redirect(target);
    }

    const { searchParams } = new URL(req.url);
    const next = safeNextPath(searchParams.get("next"));
    const state = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

    const url = buildGoogleAuthUrl(state, requestOrigin);
    const res = NextResponse.redirect(url);
    res.cookies.set(OAUTH_STATE_COOKIE, state, cookieOpts);
    res.cookies.set(OAUTH_NEXT_COOKIE, next, cookieOpts);
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(new URL("/login?error=oauth_config", publicOriginFromRequest(req)));
  }
}
