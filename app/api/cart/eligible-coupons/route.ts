import { jsonOk, jsonErr } from "@/lib/server/http";
import { getSessionUser } from "@/lib/server/auth";
import { loadCartLines } from "@/lib/server/cart";
import { getCouponDefaults } from "@/lib/server/settings";
import { getCouponUserContext } from "@/lib/server/coupon-user-context";
import { listEligibleCouponPreviews } from "@/lib/server/coupon-helpers";

/** Eligible coupons for the current server cart (for “select coupon” UI). */
export async function GET() {
  try {
    const cart = await loadCartLines();
    if (!cart?.lines.length) {
      return jsonOk({ coupons: [], subtotal: 0, apply_mode: "code_only" as const });
    }
    let subtotal = 0;
    for (const line of cart.lines) {
      subtotal += line.product.price * line.quantity;
    }
    const defaults = await getCouponDefaults();
    const user = await getSessionUser();
    const ctx = await getCouponUserContext(user);
    const coupons =
      defaults.couponApplyMode === "select"
        ? await listEligibleCouponPreviews(subtotal, ctx)
        : [];
    return jsonOk({
      coupons,
      subtotal,
      apply_mode: defaults.couponApplyMode,
    });
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to load coupons", 500);
  }
}
