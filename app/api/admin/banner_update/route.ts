import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const id = Number(body.id);
    if (!Number.isFinite(id)) return jsonErr("Invalid id");

    await prisma.banner.update({
      where: { id },
      data: {
        placement: body.placement != null ? String(body.placement) : undefined,
        title: body.title != null ? String(body.title) : undefined,
        subtitle: body.subtitle != null ? String(body.subtitle) : undefined,
        linkUrl: body.link_url != null ? String(body.link_url) : undefined,
        imagePath: body.image_path != null ? String(body.image_path) : undefined,
        sortOrder: body.sort_order != null ? Number(body.sort_order) : undefined,
        isActive: body.is_active != null ? Boolean(body.is_active) : undefined,
      },
    });
    return jsonOk({ message: "Updated" });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed", 500);
  }
}
