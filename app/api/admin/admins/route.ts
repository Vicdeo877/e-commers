import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.user.findMany({
      where: { role: "admin" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
    });
    return jsonOk({
      admins: rows.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        full_name: u.fullName,
        created_at: u.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to load admins", 500);
  }
}
