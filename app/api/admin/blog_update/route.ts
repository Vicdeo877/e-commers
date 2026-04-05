import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const id = Number(body.id);
    if (!Number.isFinite(id)) return jsonErr("Invalid id");

    let nextPublished: boolean | undefined;
    if (body.is_published === undefined || body.is_published === null) {
      nextPublished = undefined;
    } else if (
      body.is_published === false ||
      body.is_published === 0 ||
      body.is_published === "0" ||
      body.is_published === "false"
    ) {
      nextPublished = false;
    } else if (
      body.is_published === true ||
      body.is_published === 1 ||
      body.is_published === "1" ||
      body.is_published === "true"
    ) {
      nextPublished = true;
    } else {
      nextPublished = Boolean(body.is_published);
    }

    await prisma.blogPost.update({
      where: { id },
      data: {
        title: body.title != null ? String(body.title) : undefined,
        slug: body.slug != null ? String(body.slug).toLowerCase() : undefined,
        excerpt: body.excerpt != null ? String(body.excerpt) : undefined,
        content: body.content != null ? String(body.content) : undefined,
        coverImage: body.cover_image != null ? String(body.cover_image) : undefined,
        publishedAt:
          nextPublished === false
            ? null
            : nextPublished === true
              ? body.published_at
                ? new Date(String(body.published_at))
                : new Date()
              : body.published_at
                ? new Date(String(body.published_at))
                : undefined,
        isPublished: nextPublished,
      },
    });
    return jsonOk({ message: "Updated" });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed", 500);
  }
}
