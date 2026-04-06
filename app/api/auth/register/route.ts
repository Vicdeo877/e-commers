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
import { verifyEmailAddress, verifyPhoneNumber } from "@/lib/server/email-verification";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const confirm_password = String(body.confirm_password ?? "");
    const full_name = String(body.full_name ?? "").trim();
    const username = String(body.username ?? "").trim().toLowerCase();
    const phone = body.phone ? String(body.phone).trim() : undefined;

    if (!email || !password || !full_name || !username)
      return jsonErr("Missing required fields");
    if (password !== confirm_password) return jsonErr("Passwords do not match");
    if (password.length < 8) return jsonErr("Password must be at least 8 characters");

    const verified = await verifyEmailAddress(email);
    if (!verified.ok) return jsonErr(verified.message, 400);

    if (phone) {
        const phoneVerified = await verifyPhoneNumber(phone);
        if (!phoneVerified.ok) return jsonErr(phoneVerified.message, 400);
    }

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (exists) return jsonErr("Email or username already registered", 400);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        fullName: full_name,
        phone,
        role: "customer",
      },
    });

    const guestCart = getCartToken();
    await mergeGuestCart(user.id, guestCart);

    const token = await createSession(user.id);
    const res = NextResponse.json({
      success: true,
      message: "Registered",
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
    return jsonErr("Registration failed", 500);
  }
}
