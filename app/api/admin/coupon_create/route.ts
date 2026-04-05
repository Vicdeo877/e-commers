import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { optInt, parseAudienceSegment } from "@/lib/server/coupon-payload";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const code = String(body.code ?? "").trim().toUpperCase();
    const discountType = String(body.type ?? "percent") === "fixed" ? "fixed" : "percent";
    const discountValue = Number(body.value);
    const minOrder = body.min_order_amount != null ? Number(body.min_order_amount) : undefined;
    const maxDiscount = body.max_discount != null ? Number(body.max_discount) : undefined;
    const valid_until = body.valid_until ? new Date(String(body.valid_until)) : undefined;

    const audienceSegment = parseAudienceSegment(body.audience_segment);
    const isActive =
      body.is_active === false || body.is_active === 0 || body.is_active === "0" ? false : true;

    if (!code || !Number.isFinite(discountValue)) return jsonErr("Invalid coupon data");

    await prisma.coupon.create({
      data: {
        code,
        description: body.description ? String(body.description) : undefined,
        discountType,
        discountValue,
        minOrder: Number.isFinite(minOrder) ? minOrder : null,
        maxDiscount: Number.isFinite(maxDiscount) ? maxDiscount : null,
        isActive,
        expiresAt: valid_until && !isNaN(valid_until.getTime()) ? valid_until : null,
        audienceSegment,
        segmentMinOrders: optInt(body.segment_min_orders),
        segmentMaxOrders: optInt(body.segment_max_orders),
        segmentLoyalMinOrders: optInt(body.segment_loyal_min_orders),
        segmentMaxAccountAgeDays: optInt(body.segment_max_account_age_days),
        segmentMinAccountAgeDays: optInt(body.segment_min_account_age_days),
      },
    });

    return jsonOk({ message: "Created" });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to create coupon", 500);
  }
}
