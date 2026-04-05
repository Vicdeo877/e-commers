import crypto from "crypto";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const local_order_id = Number(body.local_order_id);
    const razorpay_order_id = String(body.razorpay_order_id ?? "");
    const razorpay_payment_id = String(body.razorpay_payment_id ?? "");
    const razorpay_signature = String(body.razorpay_signature ?? "");

    if (!Number.isFinite(local_order_id) || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonErr("Invalid payload", 400);
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return jsonErr("Server misconfiguration", 500);

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return jsonErr("Invalid payment signature", 400);
    }

    const order = await prisma.order.findUnique({ where: { id: local_order_id } });
    if (!order || order.razorpayOrderId !== razorpay_order_id) {
      return jsonErr("Order mismatch", 400);
    }

    await prisma.order.update({
      where: { id: local_order_id },
      data: {
        paymentStatus: "paid",
        razorpayPaymentId: razorpay_payment_id,
        orderStatus: "confirmed",
      },
    });

    return jsonOk({ message: "Payment verified" });
  } catch (e) {
    console.error(e);
    return jsonErr("Verification failed", 500);
  }
}
