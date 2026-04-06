import type { Coupon } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CouponUserContext } from "@/lib/server/coupon-user-context";
import { couponMatchesAudience } from "@/lib/server/coupon-segment";

export function discountForCouponRow(c: Coupon, subtotal: number): number {
  if (subtotal <= 0) return 0;
  if (c.minOrder != null && subtotal < c.minOrder) return 0;
  if (c.expiresAt && c.expiresAt < new Date()) return 0;
  let discount = 0;
  if (c.discountType === "percent") {
    discount = subtotal * (c.discountValue / 100);
    if (c.maxDiscount != null) discount = Math.min(discount, c.maxDiscount);
  } else {
    discount = c.discountValue;
  }
  return Math.min(discount, subtotal);
}

/** Highest discount among active coupons that pass audience + min order. */
export async function findBestCouponCode(
  subtotal: number,
  ctx: CouponUserContext
): Promise<string | null> {
  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  let bestCode: string | null = null;
  let bestD = 0;
  for (const c of coupons) {
    if (!couponMatchesAudience(c, ctx)) continue;
    const d = discountForCouponRow(c, subtotal);
    if (d > bestD) {
      bestD = d;
      bestCode = c.code;
    }
  }
  return bestCode;
}

export type EligibleCouponPreview = {
  code: string;
  description: string | null;
  discount_amount: number;
  audience_segment?: string;
};

export async function listEligibleCouponPreviews(
  subtotal: number,
  ctx: CouponUserContext
): Promise<EligibleCouponPreview[]> {
  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { code: "asc" },
  });
  const out: EligibleCouponPreview[] = [];
  for (const c of coupons) {
    if (!couponMatchesAudience(c, ctx)) continue;
    const discount_amount = discountForCouponRow(c, subtotal);
    if (discount_amount <= 0) continue;
    out.push({
      code: c.code,
      description: c.description,
      discount_amount,
      audience_segment: c.audienceSegment ?? "all",
    });
  }
  out.sort((a, b) => b.discount_amount - a.discount_amount);
  return out;
}

/** Global min subtotal (from settings) before auto-apply / listing helpers run. */
export function passesAutoApplyMinOrder(
  subtotal: number,
  minOrder: number | null | undefined
): boolean {
  if (minOrder == null || !Number.isFinite(minOrder)) return true;
  return subtotal >= minOrder;
}

/** Validates code and returns discount + canonical code (throws like checkout). */
export async function validateCouponCode(
  code: string,
  subtotal: number,
  ctx: CouponUserContext
): Promise<{ discount: number; code: string }> {
  const trimmed = code.trim();
  if (!trimmed) return { discount: 0, code: "" };
  const c = await prisma.coupon.findFirst({
    where: { code: trimmed.toUpperCase(), isActive: true },
  });
  if (!c) throw new Error("Invalid coupon");
  if (!couponMatchesAudience(c, ctx)) {
    throw new Error("This offer is not available for your account");
  }
  if (c.minOrder != null && subtotal < c.minOrder) {
    throw new Error("Minimum order value not met for this coupon");
  }
  if (c.expiresAt && c.expiresAt < new Date()) throw new Error("Coupon expired");
  const discount = discountForCouponRow(c, subtotal);

  // Check if user has already used this coupon
  const alreadyUsed = await prisma.order.findFirst({
    where: {
      userId: ctx.userId ?? undefined,
      guestEmail: ctx.kind === "guest" ? (ctx as any).guestEmail : undefined,
      couponCode: c.code,
      orderStatus: { notIn: ["cancelled", "returned"] },
    },
  });
  if (alreadyUsed) {
    throw new Error("You have already used this coupon");
  }

  return { discount, code: c.code };
}

export async function resolveCheckoutCoupon(
  subtotal: number,
  explicitCode: string | undefined,
  defaults: {
    couponApplyMode: "auto" | "select" | "code_only";
    autoApplyMinOrder: number | null;
  },
  ctx: CouponUserContext
): Promise<{ discount: number; code: string | undefined }> {
  const trimmed = explicitCode?.trim() ?? "";

  if (trimmed) {
    const v = await validateCouponCode(trimmed, subtotal, ctx);
    return { discount: v.discount, code: v.code || undefined };
  }

  if (defaults.couponApplyMode !== "auto") {
    return { discount: 0, code: undefined };
  }

  if (!passesAutoApplyMinOrder(subtotal, defaults.autoApplyMinOrder)) {
    return { discount: 0, code: undefined };
  }

  const best = await findBestCouponCode(subtotal, ctx);
  if (!best) return { discount: 0, code: undefined };

  const v = await validateCouponCode(best, subtotal, ctx);
  return { discount: v.discount, code: v.code || undefined };
}
