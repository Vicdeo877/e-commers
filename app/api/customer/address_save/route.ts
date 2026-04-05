import { jsonOk, jsonErr } from "@/lib/server/http";
import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonErr("Unauthorized", 401);

    const body = await req.json();
    const id = body.id != null ? Number(body.id) : undefined;
    const label =
      body.label != null
        ? String(body.label).trim() || undefined
        : body.address_type != null
          ? String(body.address_type).trim() || undefined
          : undefined;
    const full_name = String(
      body.full_name ?? body.fullName ?? body.recipient_name ?? ""
    ).trim();
    const phone = String(body.phone ?? body.recipient_phone ?? "").trim();
    const line1 = String(body.line1 ?? body.address ?? body.address_line1 ?? "").trim();
    const city = String(body.city ?? "").trim();
    const state = String(body.state ?? "").trim();
    const pincode = String(body.pincode ?? "").trim();
    const is_default = Boolean(body.is_default);

    if (!full_name || !line1 || !city || !state || !pincode)
      return jsonErr("Missing address fields");

    if (is_default) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    if (id) {
      await prisma.address.updateMany({
        where: { id, userId: user.id },
        data: {
          label,
          fullName: full_name,
          phone,
          line1,
          city,
          state,
          pincode,
          isDefault: is_default,
        },
      });
    } else {
      await prisma.address.create({
        data: {
          userId: user.id,
          label,
          fullName: full_name,
          phone,
          line1,
          city,
          state,
          pincode,
          isDefault: is_default,
        },
      });
    }

    return jsonOk({ message: "Saved" });
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to save address", 500);
  }
}
