import { jsonOk, jsonErr } from "@/lib/server/http";
import { getSessionUser, userPublic } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return jsonErr("Unauthorized", 401);

    const orderCount = await prisma.order.count({ where: { userId: user.id } });

    return jsonOk({
      user: userPublic(user),
      stats: { orders: orderCount },
      profile: {
        full_name: user.fullName,
        phone: user.phone,
        username: user.username,
        address: user.address,
        has_password: Boolean(user.passwordHash),
      },
    });
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to load profile", 500);
  }
}
