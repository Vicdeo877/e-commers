import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Returns Policy | BlissFruitz",
  description:
    "Quality guarantee and returns for fresh fruit orders from BlissFruitz — fast delivery, fair resolution.",
};

export default function ReturnsPage() {
  return (
    <LegalPageShell title="Returns & Refunds — Fresh Fruit">
      <p className="text-gray-600 border-l-4 border-green-500 pl-4 py-1 bg-green-50/80 rounded-r-lg">
        BlissFruitz sells <strong>only fresh, perishable fruit</strong>. We deliver quickly (
        <strong>about 20 minutes–2 hours</strong> in express zones) so your produce stays at its best. This policy
        explains how we handle quality issues and refunds.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">1. Inspect on delivery</h2>
        <p>
          Please check your fruit when the rider hands it over. Fast delivery means you can spot obvious damage or
          wrong items immediately. Mention concerns to the rider if possible, and contact us right away if something
          is wrong.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">2. Quality guarantee</h2>
        <p>
          If you receive fruit that is <strong>spoiled, badly bruised, damaged in transit, or clearly not what you</strong>{" "}
          ordered, contact us within <strong>24 hours of delivery</strong> with your order number and clear photos
          of the issue (pack + fruit). We may offer a <strong>replacement</strong> (subject to stock),{" "}
          <strong>partial or full refund</strong>, or <strong>store credit</strong>—our team decides based on the
          case.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">3. Natural fruit variation</h2>
        <p>
          Farm fruit varies in <strong>sweetness, size, colour, and shape</strong> by season—that is not a defect.
          Slight skin marks that do not affect eating quality are normal. If you are unsure, ask before ordering
          varieties you are sensitive to.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">4. No “change of mind” for perishables</h2>
        <p>
          Once fruit is delivered in acceptable condition, we generally cannot accept returns because it cannot be
          resold. Choose quantities carefully; our team can help with recommendations on{" "}
          <Link href="/contact" className="text-green-600 hover:underline">
            Contact
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">5. Wrong or missing items</h2>
        <p>
          If an item on your invoice is missing or substituted without approval, tell us within{" "}
          <strong>24 hours</strong>. We will correct with refund, replacement on the next run where possible, or
          credit.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">6. Refunds</h2>
        <p>
          Approved refunds for card/UPI payments go back to the original method, usually within{" "}
          <strong>7–14 business days</strong> after approval (banks may vary). COD refunds may be via bank transfer or
          store credit as agreed.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">7. Cancellations</h2>
        <p>
          You may cancel <strong>before</strong> your order is out for delivery (rider assigned / dispatched).
          After dispatch—especially under our <strong>20 min–2 hour</strong> service—cancellation may not be
          possible; call us immediately and we will try if the rider has not left.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">8. Storage after delivery</h2>
        <p>
          We are not responsible for spoilage caused by leaving fruit in heat or not refrigerating items that need
          cold storage after you accept delivery.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">9. Contact</h2>
        <p>
          Email{" "}
          <a href="mailto:support@freshfruit.com" className="text-green-600 hover:underline">
            support@freshfruit.com
          </a>{" "}
          with photos and order ID, or use{" "}
          <Link href="/contact" className="text-green-600 hover:underline">
            Contact
          </Link>
          . Full legal terms:{" "}
          <Link href="/terms" className="text-green-600 hover:underline">
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
