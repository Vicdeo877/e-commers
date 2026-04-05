import { NextRequest } from "next/server";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return jsonErr("Invalid id", 400);

    const u = await prisma.user.findFirst({
      where: { id, role: "customer" },
      include: {
        addresses: { orderBy: { id: "desc" } },
        orders: {
          orderBy: { id: "desc" },
          take: 25,
          select: {
            id: true,
            orderNumber: true,
            total: true,
            orderStatus: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
    });

    if (!u) return jsonErr("Customer not found", 404);

    const customer = {
      id: u.id,
      username: u.username,
      email: u.email,
      full_name: u.fullName,
      phone: u.phone ?? undefined,
      profile_address: u.address ?? undefined,
      is_active: u.isActive,
      created_at: u.createdAt.toISOString(),
      addresses: u.addresses.map((a) => ({
        id: a.id,
        label: a.label,
        full_name: a.fullName,
        phone: a.phone,
        line1: a.line1,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        is_default: a.isDefault,
      })),
      orders: u.orders.map((o) => ({
        id: o.id,
        order_number: o.orderNumber,
        total: o.total,
        order_status: o.orderStatus,
        payment_status: o.paymentStatus,
        created_at: o.createdAt.toISOString(),
      })),
    };

    return jsonOk({ customer });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to load customer", 500);
  }
}
