import type { Coupon } from "@prisma/client";
import type { CouponUserContext } from "@/lib/server/coupon-user-context";

/** Returns true if this coupon’s audience rules allow the current shopper. */
export function couponMatchesAudience(c: Coupon, ctx: CouponUserContext): boolean {
  const seg = (c.audienceSegment ?? "all").toLowerCase();
  if (seg === "all") return true;

  if (seg === "guest_only") return ctx.kind === "guest";
  if (seg === "signed_in") return ctx.kind === "user";

  if (ctx.kind === "guest") return false;

  const o = ctx.lifetimeOrderCount;
  const d = ctx.accountAgeDays;

  switch (seg) {
    case "new_user":
      return o === 0;
    case "mid_user": {
      const lo = c.segmentMinOrders ?? 1;
      const hi = c.segmentMaxOrders ?? 3;
      return o >= lo && o <= hi;
    }
    case "old_user":
      return o >= (c.segmentLoyalMinOrders ?? 4);
    case "account_under_days": {
      const max = c.segmentMaxAccountAgeDays ?? 30;
      return d <= max;
    }
    case "account_over_days": {
      const min = c.segmentMinAccountAgeDays ?? 90;
      return d >= min;
    }
    default:
      return true;
  }
}
