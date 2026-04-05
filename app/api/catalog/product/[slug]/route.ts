import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { mapProduct } from "@/lib/server/mappers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const idNum = parseInt(slug, 10);
    const product = await prisma.product.findFirst({
      where: Number.isFinite(idNum)
        ? { id: idNum, isActive: true }
        : { slug, isActive: true },
      include: { category: true },
    });
    if (!product) return jsonErr("Product not found", 404);
    return jsonOk({ product: mapProduct(product) });
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to load product", 500);
  }
}
