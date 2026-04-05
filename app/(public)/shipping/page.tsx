import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping & Delivery | BlissFruitz",
  description:
    "Fast local fruit delivery in 20 minutes to 2 hours — areas, fees, and how BlissFruitz ships fresh produce.",
};

export default function ShippingPage() {
  return (
    <LegalPageShell title="Shipping & Delivery Information">
      <p className="text-gray-600 border-l-4 border-green-500 pl-4 py-1 bg-green-50/80 rounded-r-lg">
        BlissFruitz is a <strong>fresh fruit seller</strong>: we pick, sort, and pack seasonal produce for{" "}
        <strong>same-day express delivery</strong> in our service zones.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">1. Express delivery window: 20 minutes – 2 hours</h2>
        <p>
          For eligible addresses in our local delivery network, we aim to deliver your fruit order within{" "}
          <strong>approximately 20 minutes to 2 hours</strong> from the time your order is <strong>confirmed</strong>{" "}
          (payment success or COD confirmation), during our operating hours.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Typical range:</strong> many orders arrive closer to the faster end; heavier rain, traffic,
            festivals, or high order volume may push toward the longer end of the window.
          </li>
          <li>
            The <strong>estimated time</strong> or slot shown at checkout is indicative—we will notify you by SMS
            or call if there is a significant delay.
          </li>
          <li>
            Express timing applies only where <strong>express / local delivery</strong> is available for your pincode.
            Out-of-zone orders may use different timelines if we offer them at all.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">2. Service areas</h2>
        <p>
          Enter your full address and pincode at checkout. We only commit to the <strong>20 min – 2 hour</strong>{" "}
          service where our fruit dispatch point covers your area. If express is not available, we will show an
          alternative message or ask you to choose another option before payment.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">3. Operating hours</h2>
        <p>
          Express fruit delivery runs during our published business hours (e.g. morning to evening). Orders placed
          near closing time may roll to the next operating window; the checkout page will reflect this.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">4. Delivery charges</h2>
        <p>
          Fees depend on distance, order value, and promotions. On our store, <strong>orders of ₹500 or more</strong>{" "}
          may qualify for <strong>free delivery</strong> where stated at checkout. You always see the final delivery
          fee before you pay.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">5. Packaging (fresh fruit)</h2>
        <p>
          Fruits are packed in food-grade bags or boxes to reduce bruising during quick transit. Delicate items may
          be cushioned; some items are best consumed soon after delivery for peak flavour.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">6. Handover &amp; OTP / confirmation</h2>
        <p>
          Please keep your phone reachable—our rider may call for directions. Someone should be available to
          receive the order, or leave clear gate/security instructions. Failed attempts due to wrong address or
          unreachable customer may incur a re-delivery fee or cancellation per our{" "}
          <Link href="/terms" className="text-green-600 hover:underline font-medium">
            Terms
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">7. Damaged or wrong fruit</h2>
        <p>
          Because delivery is fast, please inspect on receipt. Report crushed boxes, wrong fruit, or quality issues
          within <strong>24 hours</strong> with photos—see our{" "}
          <Link href="/returns" className="text-green-600 hover:underline font-medium">
            Returns Policy
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">8. Contact</h2>
        <p>
          Delivery help:{" "}
          <Link href="/contact" className="text-green-600 hover:underline">
            Contact us
          </Link>{" "}
          ·{" "}
          <a href="mailto:support@freshfruit.com" className="text-green-600 hover:underline">
            support@freshfruit.com
          </a>
        </p>
      </section>
    </LegalPageShell>
  );
}
