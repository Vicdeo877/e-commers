import { jsonOk, jsonErr } from "@/lib/server/http";
import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return jsonErr("Unauthorized", 401);

    const rows = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { id: "desc" },
    });

    const data = rows.map((a) => ({
      id: a.id,
      label: a.label,
      full_name: a.fullName,
      phone: a.phone,
      line1: a.line1,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      is_default: a.isDefault ? 1 : 0,
    }));

    return jsonOk(data);
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to load addresses", 500);
  }
}
