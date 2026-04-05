import { NextRequest } from "next/server";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { mapOrderAdmin } from "@/lib/server/mappers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return jsonErr("Invalid id", 400);

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return jsonErr("Not found", 404);

    return jsonOk({ order: mapOrderAdmin(order) });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to load order", 500);
  }
}
