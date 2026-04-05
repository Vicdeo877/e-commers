import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jsonErr, getCartToken } from "@/lib/server/http";
import {
  createSession,
  sessionCookieHeader,
  mergeGuestCart,
  userPublic,
} from "@/lib/server/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!email || !password) return jsonErr("Email and password required");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return jsonErr("Invalid credentials", 401);
    if ((user as any).isActive === false) return jsonErr("Your account has been deactivated.", 403);
    if (!user.passwordHash) {
      return jsonErr(
        "This account uses Google sign-in. Use “Continue with Google” on the login page.",
        401
      );
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return jsonErr("Invalid credentials", 401);

    const guestCart = getCartToken();
    await mergeGuestCart(user.id, guestCart);

    const token = await createSession(user.id);
    const res = NextResponse.json({
      success: true,
      message: "OK",
      data: { user: userPublic(user) },
    });
    res.headers.append("Set-Cookie", sessionCookieHeader(token));
    if (guestCart) {
      res.headers.append(
        "Set-Cookie",
        `bf_cart=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
      );
    }
    return res;
  } catch (e) {
    console.error(e);
    return jsonErr("Login failed", 500);
  }
}
