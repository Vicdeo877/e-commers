import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "bf_session";
export const CART_COOKIE = "bf_cart";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function jsonErr(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export function appendSetCookie<T>(res: NextResponse<T>, cookie: string): NextResponse<T> {
  const cur = res.headers.get("Set-Cookie");
  if (cur) res.headers.append("Set-Cookie", cookie);
  else res.headers.set("Set-Cookie", cookie);
  return res;
}

export function cookieAuth(token: string, maxAgeSec: number) {
  return `${AUTH_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function cookieCart(token: string, maxAgeSec: number) {
  return `${CART_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function clearCookieAuth() {
  return `${AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function clearCookieCart() {
  return `${CART_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function getAuthToken() {
  return cookies().get(AUTH_COOKIE)?.value ?? null;
}

export function getCartToken() {
  return cookies().get(CART_COOKIE)?.value ?? null;
}
