import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();

    const results = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.coupon.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "customer" } }),
      prisma.order.count({
        where: {
          orderStatus: { in: ["pending", "confirmed", "processing"] },
        },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { id: "desc" },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          orderStatus: true,
          createdAt: true,
        },
      }),
      prisma.contactMessage.count({ where: { isRead: false } }),
    ]);

    const products = results[0] as number;
    const orders = results[1] as number;
    const revenueAgg = results[2] as { _sum: { total: number | null } };
    const coupons = results[3] as number;
    const customers = results[4] as number;
    const pendingOrders = results[5] as number;
    const recentRaw = results[6] as any[];
    const pendingMessages = results[7] as number;

    const recent_orders = recentRaw.map((o) => ({
      id: o.id,
      order_number: o.orderNumber,
      total: o.total,
      order_status: o.orderStatus,
      created_at: o.createdAt.toISOString(),
    }));

    return jsonOk({
      products,
      orders,
      revenue: revenueAgg._sum.total ?? 0,
      coupons,
      users: customers,
      pending_orders: pendingOrders,
      recent_orders,
      pending_messages: pendingMessages,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to load stats", 500);
  }
}
