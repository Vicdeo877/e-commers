import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { id } = await req.json();

    if (!id) return jsonErr("ID is required", 400);

    const message = await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true }
    });

    return jsonOk({ message });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to update message status", 500);
  }
}
