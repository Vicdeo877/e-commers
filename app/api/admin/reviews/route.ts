import { NextRequest } from "next/server";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { mapReviewPublic } from "@/lib/server/mappers";

const PER_PAGE = 20;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const page = Math.max(1, parseInt(new URL(req.url).searchParams.get("page") ?? "1", 10));

    const total = await prisma.review.count();
    const reviews = await prisma.review.findMany({
      include: { user: true, product: { select: { name: true, slug: true } } },
      orderBy: { id: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    });

    return jsonOk({
      reviews: reviews.map((r) =>
        mapReviewPublic(r, r.product ? { name: r.product.name, slug: r.product.slug } : undefined)
      ),
      pagination: {
        page,
        per_page: PER_PAGE,
        total,
        total_pages: Math.ceil(total / PER_PAGE),
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to load reviews", 500);
  }
}
