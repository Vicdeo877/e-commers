import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    let slug = String(body.slug ?? "").trim().toLowerCase();
    if (!title) return jsonErr("Title required");
    if (!slug) slug = slugify(title);

    const publish =
      body.is_published !== false &&
      body.is_published !== 0 &&
      body.is_published !== "0" &&
      body.is_published !== "false";

    await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: body.excerpt ? String(body.excerpt) : undefined,
        content: String(body.content ?? ""),
        coverImage: body.cover_image ? String(body.cover_image) : undefined,
        publishedAt: publish
          ? body.published_at
            ? new Date(String(body.published_at))
            : new Date()
          : null,
        isPublished: publish,
      },
    });
    return jsonOk({ message: "Created" });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed", 500);
  }
}
