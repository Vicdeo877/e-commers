import bcrypt from "bcryptjs";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonErr("Unauthorized", 401);

    const body = await req.json();
    const current_password = String(body.current_password ?? "");
    const new_password = String(body.new_password ?? "");
    if (!new_password) return jsonErr("New password required");
    if (new_password.length < 8) return jsonErr("New password must be at least 8 characters");

    const full = await prisma.user.findUnique({ where: { id: user.id } });
    if (!full) return jsonErr("User not found", 404);

    if (full.passwordHash) {
      if (!current_password) return jsonErr("Current password required");
      const ok = await bcrypt.compare(current_password, full.passwordHash);
      if (!ok) return jsonErr("Current password is wrong", 400);
    }

    const passwordHash = await bcrypt.hash(new_password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return jsonOk({ message: "Password updated" });
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to change password", 500);
  }
}
