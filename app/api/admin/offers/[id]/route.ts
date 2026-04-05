import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { clientVisibleError } from "@/lib/server/api-error";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isFinite(id) || id < 1) return jsonErr("Invalid id", 404);

    const existing = await prisma.offer.findUnique({ where: { id } });
    if (!existing) return jsonErr("Offer not found", 404);

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return jsonErr("Invalid JSON body", 400);
    }
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    if (!title || !description) return jsonErr("Title and description are required", 400);

    const discountValue = Number(body.discount_value);
    const sortOrder = Number(body.sort_order);
    const couponCode =
      body.coupon_code != null && String(body.coupon_code).trim() !== ""
        ? String(body.coupon_code).trim().toUpperCase()
        : null;

    const highlightOn =
      body.highlight === true ||
      body.highlight === 1 ||
      body.highlight === "1" ||
      body.highlight === "true";
    const activeOn =
      body.is_active !== false &&
      body.is_active !== 0 &&
      body.is_active !== "0" &&
      body.is_active !== "false";

    await prisma.offer.update({
      where: { id },
      data: {
        title: title.slice(0, 200),
        description: description.slice(0, 2000),
        couponCode,
        discountValue: Number.isFinite(discountValue) ? discountValue : 0,
        isActive: activeOn,
        sortOrder: Number.isFinite(sortOrder) ? Math.floor(sortOrder) : 0,
        highlight: highlightOn,
      },
    });

    return jsonOk({ message: "Updated" });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error("[admin/offers PATCH]", e);
    return jsonErr(clientVisibleError(e, "Failed to update offer"), 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isFinite(id) || id < 1) return jsonErr("Invalid id", 400);

    const existing = await prisma.offer.findUnique({ where: { id } });
    if (!existing) return jsonErr("Offer not found", 404);

    await prisma.offer.delete({ where: { id } });
    return jsonOk({ message: "Deleted" });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error("[admin/offers DELETE]", e);
    return jsonErr(clientVisibleError(e, "Failed to delete offer"), 500);
  }
}
