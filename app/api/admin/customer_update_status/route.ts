import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const id = Number(body.id);
    const is_active = Boolean(body.is_active);

    if (!Number.isFinite(id)) return jsonErr("Invalid payload");

    await prisma.user.update({
      where: { id },
      data: { isActive: is_active },
    });

    if (!is_active) {
      await prisma.session.deleteMany({
        where: { userId: id }
      });
    }

    return jsonOk({ message: "Customer status updated" });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to update customer status", 500);
  }
}
