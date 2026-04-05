import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin, userPublic } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const confirm_password = String(body.confirm_password ?? "");
    const full_name = String(body.full_name ?? "").trim();
    const username = String(body.username ?? "").trim().toLowerCase();
    const phone = body.phone ? String(body.phone).trim() : undefined;

    if (!email || !password || !full_name || !username)
      return jsonErr("Email, username, full name, and password are required");
    if (password !== confirm_password) return jsonErr("Passwords do not match");
    if (password.length < 8) return jsonErr("Password must be at least 8 characters");

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (exists) return jsonErr("Email or username already in use", 400);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        fullName: full_name,
        phone: phone || undefined,
        role: "admin",
      },
    });

    return jsonOk({
      user: userPublic(user),
      message: "Admin user created. They can sign in with the email and password you set.",
    });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to create admin user", 500);
  }
}
