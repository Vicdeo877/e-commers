import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
} from "@/lib/server/google-oauth";
import { upsertGoogleUser } from "@/lib/server/google-user";
import {
  createSession,
  mergeGuestCart,
  setSessionCookie,
} from "@/lib/server/auth";
import { publicOriginFromRequest, safeNextPath } from "@/lib/server/app-origin";
import { CART_COOKIE, getCartToken } from "@/lib/server/http";

const clearOpts = {
  path: "/",
  maxAge: 0,
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const requestOrigin = publicOriginFromRequest(req);

  const cookieStore = cookies();
  const savedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value ?? null;
  const nextRaw = cookieStore.get(OAUTH_NEXT_COOKIE)?.value ?? "/";
  const next = safeNextPath(nextRaw);

  const fail = (path: string) => {
    const res = NextResponse.redirect(new URL(path, requestOrigin));
    res.cookies.set(OAUTH_STATE_COOKIE, "", { ...clearOpts, httpOnly: true, sameSite: "lax" });
    res.cookies.set(OAUTH_NEXT_COOKIE, "", { ...clearOpts, httpOnly: true, sameSite: "lax" });
    return res;
  };

  if (oauthError) {
    return fail(`/login?error=${encodeURIComponent(oauthError)}`);
  }

  if (!code || !state || !savedState || state !== savedState) {
    return fail("/login?error=oauth_state");
  }

  try {
    const tokens = await exchangeGoogleCode(code, requestOrigin);
    const info = await fetchGoogleUserInfo(tokens.access_token);
    const user = await upsertGoogleUser(info);

    if ((user as any).isActive === false) {
      return fail("/login?error=account_deactivated");
    }

    const guestCart = getCartToken();
    await mergeGuestCart(user.id, guestCart);

    const sessionToken = await createSession(user.id);

    const res = NextResponse.redirect(new URL(next, requestOrigin));
    setSessionCookie(res, sessionToken);
    res.cookies.set(OAUTH_STATE_COOKIE, "", { ...clearOpts, httpOnly: true, sameSite: "lax" });
    res.cookies.set(OAUTH_NEXT_COOKIE, "", { ...clearOpts, httpOnly: true, sameSite: "lax" });
    if (guestCart) {
      res.cookies.set(CART_COOKIE, "", { ...clearOpts, httpOnly: true, sameSite: "lax" });
    }
    return res;
  } catch (e) {
    console.error("Google callback:", e);
    return fail("/login?error=google_signin");
  }
}
