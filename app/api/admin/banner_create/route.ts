import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    await prisma.banner.create({
      data: {
        placement: String(body.placement ?? "hero"),
        title: String(body.title ?? ""),
        subtitle: String(body.subtitle ?? ""),
        linkUrl: body.link_url ? String(body.link_url) : undefined,
        imagePath: body.image_path ? String(body.image_path) : undefined,
        sortOrder: body.sort_order != null ? Number(body.sort_order) : 0,
        isActive: body.is_active !== false,
      },
    });
    return jsonOk({ message: "Created" });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed", 500);
  }
}
