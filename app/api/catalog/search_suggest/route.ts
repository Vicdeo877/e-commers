import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonErr } from "@/lib/server/http";

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return jsonOk({ suggestions: [] });

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { slug: { contains: q } },
        ],
      },
      take: 8,
      select: { name: true, slug: true },
    });

    return jsonOk({
      suggestions: products.map((p) => ({ label: p.name, slug: p.slug })),
    });
  } catch (e) {
    console.error(e);
    return jsonErr("Search failed", 500);
  }
}
