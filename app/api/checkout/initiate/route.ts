import Razorpay from "razorpay";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { getSessionUser } from "@/lib/server/auth";
import { loadCartLines } from "@/lib/server/cart";
import { prisma } from "@/lib/prisma";
import { getShippingRates, getPaymentFlags, getCouponDefaults } from "@/lib/server/settings";
import { verifyEmailAddress } from "@/lib/server/email-verification";
import { resolveCheckoutCoupon } from "@/lib/server/coupon-helpers";
import { getCouponUserContext } from "@/lib/server/coupon-user-context";

function orderNumber() {
  return `BF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payment_method = String(body.payment_method ?? "cod");
    const user = await getSessionUser();
    const guest_email = String(body.guest_email ?? "").trim();

    /** Cart page “Apply coupon” — only checks code + server cart totals; no shipping yet */
    if (body.dry_run === true) {
      const cart = await loadCartLines();
      if (!cart?.lines.length) return jsonErr("Cart is empty", 400);
      let subtotal = 0;
      for (const line of cart.lines) {
        subtotal += line.product.price * line.quantity;
      }
      const coupon_code =
        body.coupon_code != null ? String(body.coupon_code) : undefined;
      try {
        const defaults = await getCouponDefaults();
        const ctx = await getCouponUserContext(user);
        const resolved = await resolveCheckoutCoupon(subtotal, coupon_code, defaults, ctx);
        return jsonOk({
          discount_amount: resolved.discount,
          subtotal,
          coupon_code: resolved.code ?? null,
        });
      } catch (e) {
        return jsonErr(e instanceof Error ? e.message : "Invalid coupon", 400);
      }
    }

    if (!user && !guest_email) return jsonErr("Email is required for guest checkout", 400);

    if (!user && guest_email) {
      const verified = await verifyEmailAddress(guest_email);
      if (!verified.ok) return jsonErr(verified.message, 400);
    }

    const payFlags = await getPaymentFlags();
    if (payment_method === "cod" && !payFlags.codEnabled) {
      return jsonErr("Cash on delivery is disabled", 400);
    }
    if (payment_method === "razorpay" && !payFlags.razorpayEnabled) {
      return jsonErr("Online payment (Razorpay) is disabled", 400);
    }

    const cart = await loadCartLines();
    if (!cart?.lines.length) return jsonErr("Cart is empty", 400);

    const shipping_name = String(body.shipping_name ?? "").trim();
    const shipping_phone = String(body.shipping_phone ?? "").trim();
    const shipping_address = String(body.shipping_address ?? "").trim();
    const shipping_city = String(body.shipping_city ?? "").trim();
    const shipping_state = String(body.shipping_state ?? "").trim();
    const shipping_pincode = String(body.shipping_pincode ?? "").trim();
    const notes = body.notes != null ? String(body.notes) : "";
    const coupon_code = body.coupon_code != null ? String(body.coupon_code) : undefined;

    if (!shipping_name || !shipping_phone || !shipping_address || !shipping_city || !shipping_pincode) {
      return jsonErr("Please fill all required shipping fields", 400);
    }

    for (const line of cart.lines) {
      if (line.quantity > line.product.stockQuantity) {
        return jsonErr(`Not enough stock for ${line.product.name}`, 400);
      }
    }

    let subtotal = 0;
    for (const line of cart.lines) {
      subtotal += line.product.price * line.quantity;
    }

    let discountAmount = 0;
    let appliedCoupon: string | undefined;
    try {
      const defaults = await getCouponDefaults();
      const ctx = await getCouponUserContext(user);
      const resolved = await resolveCheckoutCoupon(subtotal, coupon_code, defaults, ctx);
      discountAmount = resolved.discount;
      appliedCoupon = resolved.code;
    } catch (e) {
      return jsonErr(e instanceof Error ? e.message : "Invalid coupon", 400);
    }

    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const ship = await getShippingRates();
    const shippingAmount =
      afterDiscount >= ship.freeShippingMin ? 0 : ship.flatRate;
    const total = afterDiscount + shippingAmount;

    const ordNo = orderNumber();

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: ordNo,
          userId: user?.id,
          guestEmail: user ? null : guest_email,
          shippingName: shipping_name,
          shippingPhone: shipping_phone,
          shippingAddress: shipping_address,
          shippingCity: shipping_city,
          shippingState: shipping_state,
          shippingPincode: shipping_pincode,
          notes,
          subtotal,
          shippingAmount,
          discountAmount,
          total,
          couponCode: appliedCoupon,
          orderStatus: "pending",
          paymentStatus: payment_method === "cod" ? "pending" : "pending",
          paymentMethod: payment_method,
        },
      });

      for (const line of cart.lines) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: line.productId,
            name: line.product.name,
            price: line.product.price,
            quantity: line.quantity,
          },
        });
        await tx.product.update({
          where: { id: line.productId },
          data: { stockQuantity: { decrement: line.quantity } },
        });
      }

      await tx.cartLine.deleteMany({ where: { cartId: cart.id } });

      return order;
    });

    if (payment_method === "cod") {
      return jsonOk({
        order_id: result.id,
        order_number: result.orderNumber,
        local_order_id: result.id,
      });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return jsonErr("Razorpay is not configured on the server (set RAZORPAY_KEY_SECRET)", 500);
    }

    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const amountPaise = Math.round(total * 100);
    const rzpOrder = await rzp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `bf_${result.id}`,
      notes: { local_order_id: String(result.id) },
    });

    await prisma.order.update({
      where: { id: result.id },
      data: { razorpayOrderId: rzpOrder.id },
    });

    return jsonOk({
      order_id: result.id,
      order_number: result.orderNumber,
      local_order_id: result.id,
      amount: amountPaise,
      currency: "INR",
      razorpay_order_id: rzpOrder.id,
    });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Checkout failed";
    return jsonErr(msg, 500);
  }
}
