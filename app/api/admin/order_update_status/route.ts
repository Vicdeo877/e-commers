import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const id = Number(body.id);
    const order_status = String(body.order_status ?? "").trim();
    const tracking_number = body.tracking_number != null ? String(body.tracking_number) : undefined;
    const payment_status = body.payment_status != null ? String(body.payment_status).trim() : undefined;

    if (!Number.isFinite(id) || (!order_status && !payment_status)) return jsonErr("Invalid payload");

    await prisma.order.update({
      where: { id },
      data: {
        ...(order_status ? { orderStatus: order_status } : {}),
        ...(tracking_number !== undefined ? { trackingNumber: tracking_number || null } : {}),
        ...(payment_status ? { paymentStatus: payment_status } : {}),
      },
    });

    return jsonOk({ message: "Updated" });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to update order", 500);
  }
}
