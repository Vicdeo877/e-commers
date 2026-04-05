import { prisma } from "@/lib/prisma";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { mapCategory } from "@/lib/server/mappers";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return jsonOk({ categories: categories.map(mapCategory) });
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to load categories", 500);
  }
}
