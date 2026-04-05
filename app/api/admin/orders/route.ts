import { NextRequest } from "next/server";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { mapOrderAdmin } from "@/lib/server/mappers";

const PER_PAGE = 25;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = new URL(req.url).searchParams;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const q = sp.get("q")?.trim();
    const status = sp.get("status")?.trim();

    const parts: object[] = [];
    if (status) parts.push({ orderStatus: status });
    if (q) {
      parts.push({
        OR: [
          { orderNumber: { contains: q } },
          { shippingPhone: { contains: q } },
          { guestEmail: { contains: q } },
        ],
      });
    }
    const where = parts.length === 0 ? {} : parts.length === 1 ? parts[0] : { AND: parts };

    const total = await prisma.order.count({ where });
    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { id: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    });

    return jsonOk({
      orders: orders.map((o) => mapOrderAdmin(o)),
      pagination: {
        page,
        per_page: PER_PAGE,
        total,
        total_pages: Math.ceil(total / PER_PAGE),
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to load orders", 500);
  }
}
