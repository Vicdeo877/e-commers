import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { getProductCatalogDefaults } from "@/lib/server/settings";
import { generateNextSku } from "@/lib/server/sku";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    let slug = String(body.slug ?? "").trim().toLowerCase();
    if (!name) return jsonErr("Name required");
    if (!slug) slug = slugify(name);

    const price = Number(body.price);
    const stock_quantity = parseInt(String(body.stock_quantity ?? "0"), 10);
    if (!Number.isFinite(price) || price < 0) return jsonErr("Invalid price");
    if (!Number.isFinite(stock_quantity) || stock_quantity < 0) return jsonErr("Invalid stock");

    const bodySku = body.sku != null ? String(body.sku).trim() : "";
    const catalog = await getProductCatalogDefaults();
    let sku: string | undefined = bodySku || undefined;
    if (catalog.skuAutoGenerate && !bodySku) {
      sku = await generateNextSku(catalog.skuPrefix);
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        sku,
        description: body.description ? String(body.description) : undefined,
        shortDescription: body.short_description ? String(body.short_description) : undefined,
        price,
        comparePrice: body.compare_price != null ? Number(body.compare_price) : undefined,
        unit: body.unit ? String(body.unit) : "kg",
        stockQuantity: stock_quantity,
        imageMain: body.image_main ? String(body.image_main) : undefined,
        categoryId: body.category_id ? Number(body.category_id) : undefined,
        isActive: body.is_active !== false && body.is_active !== 0,
        isFeatured: Boolean(body.is_featured),
      },
    });

    return jsonOk({ product: { id: product.id, sku: product.sku } });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to create product", 500);
  }
}
