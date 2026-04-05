import { jsonOk, jsonErr } from "@/lib/server/http";
import { getSessionUser } from "@/lib/server/auth";
import { loadCartLines } from "@/lib/server/cart";
import { prisma } from "@/lib/prisma";
import { getCouponUserContext } from "@/lib/server/coupon-user-context";
import {
  buildRecommendPayload,
  rankOffersForContext,
} from "@/lib/server/offer-recommendations";

/**
 * Personalized “best offer” + ranked list for the current cart and signed-in user (or guest).
 * Uses rule-based intelligence (segment matching + max discount). No external AI required.
 */
export async function GET() {
  try {
    const cart = await loadCartLines();
    let subtotal = 0;
    if (cart?.lines.length) {
      for (const line of cart.lines) {
        subtotal += line.product.price * line.quantity;
      }
    }

    const user = await getSessionUser();
    const ctx = await getCouponUserContext(user);

    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    const ranked = rankOffersForContext(coupons, subtotal, ctx);
    return jsonOk(buildRecommendPayload(subtotal, ctx, ranked));
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to compute offers", 500);
  }
}
