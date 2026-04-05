import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { mapBlogDetail } from "@/lib/server/mappers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = await prisma.blogPost.findFirst({
      where: { slug, isPublished: true },
    });
    if (!post) return jsonErr("Not found", 404);
    return jsonOk({ post: mapBlogDetail(post) });
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to load post", 500);
  }
}
