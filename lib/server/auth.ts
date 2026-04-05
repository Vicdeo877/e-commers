import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE, getAuthToken } from "@/lib/server/http";
import type { User } from "@prisma/client";

const SESSION_DAYS = 30;

export async function getSessionUser(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  if ((session.user as any).isActive === false) return null;
  return session.user;
}

export async function requireUser(): Promise<User> {
  const u = await getSessionUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export async function requireAdmin(): Promise<User> {
  const u = await getSessionUser();
  if (!u || u.role !== "admin") throw new Error("FORBIDDEN");
  return u;
}

export async function createSession(userId: number) {
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  return token;
}

export function sessionCookieHeader(token: string) {
  return `bf_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

/** Prefer this on redirects — raw Set-Cookie headers are easier to drop than `cookies.set` in some cases. */
export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroySession(token: string | null) {
  if (!token) return;
  await prisma.session.deleteMany({ where: { token } });
}

export async function mergeGuestCart(userId: number, guestToken: string | null) {
  if (!guestToken) return;
  const guest = await prisma.cart.findUnique({
    where: { guestToken },
    include: { lines: true },
  });
  if (!guest || guest.lines.length === 0) {
    await prisma.cart.deleteMany({ where: { guestToken } }).catch(() => {});
    return;
  }
  let userCart = await prisma.cart.findUnique({ where: { userId } });
  if (!userCart) {
    userCart = await prisma.cart.create({ data: { userId } });
  }
  for (const line of guest.lines) {
    const existing = await prisma.cartLine.findUnique({
      where: { cartId_productId: { cartId: userCart.id, productId: line.productId } },
    });
    if (existing) {
      await prisma.cartLine.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + line.quantity },
      });
    } else {
      await prisma.cartLine.create({
        data: { cartId: userCart.id, productId: line.productId, quantity: line.quantity },
      });
    }
  }
  await prisma.cart.delete({ where: { id: guest.id } });
}

export function userPublic(u: User) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    full_name: u.fullName,
    phone: u.phone ?? undefined,
    role: u.role === "admin" ? "admin" : "customer",
  };
}
