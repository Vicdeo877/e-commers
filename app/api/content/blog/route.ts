import { prisma } from "@/lib/prisma";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { mapBlogList } from "@/lib/server/mappers";

export async function GET() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
    });
    return jsonOk({ posts: posts.map(mapBlogList) });
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to load blog", 500);
  }
}
