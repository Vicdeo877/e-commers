import type { Coupon } from "@prisma/client";
import type { CouponUserContext } from "@/lib/server/coupon-user-context";
import { describeUserSegment } from "@/lib/server/coupon-user-context";
import { discountForCouponRow } from "@/lib/server/coupon-helpers";
import { couponMatchesAudience } from "@/lib/server/coupon-segment";

export function explainAudienceRule(c: Coupon): string {
  const seg = (c.audienceSegment ?? "all").toLowerCase();
  switch (seg) {
    case "all":
      return "Available to all shoppers";
    case "guest_only":
      return "Only for guests (not logged in)";
    case "signed_in":
      return "Only when logged in";
    case "new_user":
      return "First purchase on this account (0 completed orders)";
    case "mid_user": {
      const lo = c.segmentMinOrders ?? 1;
      const hi = c.segmentMaxOrders ?? 3;
      return `Returning customers with ${lo}–${hi} completed orders`;
    }
    case "old_user":
      return `Loyal customers with ${c.segmentLoyalMinOrders ?? 4}+ completed orders`;
    case "account_under_days":
      return `Account age ≤ ${c.segmentMaxAccountAgeDays ?? 30} days`;
    case "account_over_days":
      return `Account age ≥ ${c.segmentMinAccountAgeDays ?? 90} days`;
    default:
      return "Custom audience rule";
  }
}

export type RankedOffer = {
  code: string;
  description: string | null;
  discount_amount: number;
  audience_segment: string;
  rule_summary: string;
  score: number;
};

/** Deterministic ranking: highest rupee discount first; tie-break by code. */
export function rankOffersForContext(
  coupons: Coupon[],
  subtotal: number,
  ctx: CouponUserContext
): RankedOffer[] {
  const out: RankedOffer[] = [];
  for (const c of coupons) {
    if (!couponMatchesAudience(c, ctx)) continue;
    const discount_amount = discountForCouponRow(c, subtotal);
    if (discount_amount <= 0) continue;
    out.push({
      code: c.code,
      description: c.description,
      discount_amount,
      audience_segment: c.audienceSegment ?? "all",
      rule_summary: explainAudienceRule(c),
      score: discount_amount,
    });
  }
  out.sort((a, b) => b.score - a.score || a.code.localeCompare(b.code));
  return out;
}

export function buildRecommendPayload(
  subtotal: number,
  ctx: CouponUserContext,
  ranked: RankedOffer[]
) {
  const best = ranked[0] ?? null;
  return {
    engine: "rules_v1" as const,
    user_segment: describeUserSegment(ctx),
    user_facts: {
      is_guest: ctx.kind === "guest",
      lifetime_orders: ctx.lifetimeOrderCount,
      account_age_days: ctx.accountAgeDays,
    },
    subtotal,
    best_offer: best
      ? {
          code: best.code,
          description: best.description,
          discount_amount: best.discount_amount,
          why: best.rule_summary,
        }
      : null,
    ranked_offers: ranked.slice(0, 12),
    note:
      "Recommendations use order history, account age, and cart subtotal. Plug an external LLM on top of this API if you need natural-language copy.",
  };
}
