import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const product_id = Number(body.product_id);
    if (!Number.isFinite(product_id)) return jsonErr("Invalid product");

    await prisma.product.delete({ where: { id: product_id } });

    return jsonOk({ message: "Deleted" });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to delete", 500);
  }
}
