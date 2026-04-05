import { jsonOk, jsonErr } from "@/lib/server/http";
import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { mapOrderAdmin } from "@/lib/server/mappers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return jsonErr("Unauthorized", 401);

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { id: "desc" },
    });

    return jsonOk({
      orders: orders.map((o) => mapOrderAdmin(o)),
    });
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to load orders", 500);
  }
}
