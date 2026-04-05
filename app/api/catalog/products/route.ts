import type { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { getSessionUser } from "@/lib/server/auth";
import { mapProduct } from "@/lib/server/mappers";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const categoryId = searchParams.get("category_id");
    const user = await getSessionUser();
    const admin = user?.role === "admin";

    const where: Prisma.ProductWhereInput = {};
    if (!admin) where.isActive = true;
    if (categoryId) where.categoryId = parseInt(categoryId, 10);
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { slug: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { id: "asc" },
    });

    return jsonOk({ products: products.map((p) => mapProduct(p, { admin })) });
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to load products", 500);
  }
}
