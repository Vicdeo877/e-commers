import { NextRequest } from "next/server";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { mapReviewPublic } from "@/lib/server/mappers";

export async function GET(req: NextRequest) {
  try {
    const product_id = Number(new URL(req.url).searchParams.get("product_id"));
    if (!Number.isFinite(product_id)) return jsonErr("product_id required", 400);

    const reviews = await prisma.review.findMany({
      where: { productId: product_id, approved: true },
      include: { user: true },
      orderBy: { id: "desc" },
    });

    return jsonOk({
      reviews: reviews.map((r) => mapReviewPublic(r)),
    });
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to load reviews", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product_id = Number(body.product_id);
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
    const title = body.title != null ? String(body.title) : undefined;
    const comment = body.comment != null ? String(body.comment) : undefined;
    const guest_name = body.guest_name != null ? String(body.guest_name) : undefined;

    if (!Number.isFinite(product_id)) return jsonErr("Invalid product", 400);

    const product = await prisma.product.findFirst({ where: { id: product_id, isActive: true } });
    if (!product) return jsonErr("Product not found", 404);

    const user = await getSessionUser();

    await prisma.review.create({
      data: {
        productId: product_id,
        userId: user?.id,
        guestName: user ? undefined : guest_name,
        rating,
        title,
        comment,
        approved: false,
      },
    });

    return jsonOk({ message: "Review submitted" });
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to submit review", 500);
  }
}
