import { jsonOk, jsonErr } from "@/lib/server/http";
import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonErr("Unauthorized", 401);

    const body = await req.json();
    const full_name = body.full_name != null ? String(body.full_name).trim() : undefined;
    const phone = body.phone != null ? String(body.phone).trim() : undefined;
    const username = body.username != null ? String(body.username).trim().toLowerCase() : undefined;

    if (username && username !== user.username) {
      const taken = await prisma.user.findUnique({ where: { username } });
      if (taken) return jsonErr("Username already taken", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(full_name !== undefined ? { fullName: full_name } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(username !== undefined ? { username } : {}),
      },
    });

    return jsonOk({ message: "Updated" });
  } catch (e) {
    console.error(e);
    return jsonErr("Update failed", 500);
  }
}
