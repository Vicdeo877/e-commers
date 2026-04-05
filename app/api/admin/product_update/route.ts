import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const id = Number(body.id);
    if (!Number.isFinite(id)) return jsonErr("Invalid id");

    const name = String(body.name ?? "").trim();
    let slug = String(body.slug ?? "").trim().toLowerCase();
    if (!name) return jsonErr("Name required");
    if (!slug) slug = slugify(name);

    const price = Number(body.price);
    const stock_quantity = parseInt(String(body.stock_quantity ?? "0"), 10);

    await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        sku: body.sku ? String(body.sku) : null,
        description: body.description != null ? String(body.description) : undefined,
        shortDescription: body.short_description != null ? String(body.short_description) : undefined,
        price,
        comparePrice: body.compare_price != null && body.compare_price !== "" ? Number(body.compare_price) : null,
        unit: body.unit ? String(body.unit) : "kg",
        stockQuantity: stock_quantity,
        imageMain: body.image_main != null ? String(body.image_main) : undefined,
        categoryId: body.category_id ? Number(body.category_id) : null,
        isActive: body.is_active !== false && body.is_active !== 0,
        isFeatured: Boolean(body.is_featured),
      },
    });

    return jsonOk({ message: "Updated" });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to update product", 500);
  }
}
