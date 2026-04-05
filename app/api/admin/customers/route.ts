import { NextRequest } from "next/server";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

const PER_PAGE = 20;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = new URL(req.url).searchParams;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const q = sp.get("q")?.trim();

    const where = {
      role: "customer" as const,
      ...(q
        ? {
            OR: [
              { email: { contains: q } },
              { fullName: { contains: q } },
              { username: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    };

    const total = await prisma.user.count({ where });
    const rows = await prisma.user.findMany({
      where,
      include: {
        _count: { select: { orders: true, addresses: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    });

    const customers = rows.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      full_name: u.fullName,
      phone: u.phone ?? undefined,
      profile_address: u.address ?? undefined,
      created_at: u.createdAt.toISOString(),
      order_count: u._count.orders,
      address_count: u._count.addresses,
      is_active: u.isActive,
    }));

    return jsonOk({
      customers,
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
    return jsonErr("Failed to load customers", 500);
  }
}
