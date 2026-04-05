import { NextRequest } from "next/server";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { mapOrderAdmin } from "@/lib/server/mappers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonErr("Unauthorized", 401);

    const id = Number((await params).id);
    if (!Number.isFinite(id)) return jsonErr("Invalid order", 400);

    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: { items: true },
    });
    if (!order) return jsonErr("Not found", 404);

    return jsonOk({ order: mapOrderAdmin(order) });
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to load order", 500);
  }
}
