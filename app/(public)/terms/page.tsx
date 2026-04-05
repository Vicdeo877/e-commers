import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | BlissFruitz",
  description:
    "Terms for buying fresh fruits from BlissFruitz — quality, seasonal produce with fast local delivery.",
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms & Conditions">
      <p className="text-gray-600 border-l-4 border-green-500 pl-4 py-1 bg-green-50/80 rounded-r-lg">
        BlissFruitz is a <strong>fresh fruit seller</strong>: we source seasonal mangoes, berries, citrus, bananas,
        apples, and more—picked and packed for same-day quality. By using this website (“the Site”), you agree to
        these terms.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">1. Eligibility</h2>
        <p>
          You must be at least 18 years old (or have parental consent) to order. Checkout details—especially
          delivery address and phone—must be accurate so we can reach you for{" "}
          <strong>20 minute–2 hour</strong> delivery windows where offered.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">2. Fresh fruit &amp; seasonality</h2>
        <p>
          We sell <strong>perishable fresh fruits</strong> only (and related items if listed). Photos and
          descriptions are indicative: natural variation in size, colour, ripeness, and sugar content is normal
          for farm produce. Stock depends on harvest and season—we may substitute a comparable variety with your
          consent, or cancel/refund if unavailable.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">3. Orders &amp; pricing</h2>
        <p>
          Your order is an offer to buy. We confirm when payment is accepted or COD is scheduled. All prices are
          in <strong>INR</strong> (taxes as shown at checkout). Coupons and offers follow their stated rules and
          dates.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">4. Payment</h2>
        <p>
          We accept <strong>cash on delivery (COD)</strong> and online payment (e.g. via Razorpay) where enabled.
          You authorise us to charge the total shown for confirmed orders. Chargebacks must follow our{" "}
          <Link href="/returns" className="text-green-600 hover:underline font-medium">
            Returns Policy
          </Link>{" "}
          and payment partner rules.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">5. Delivery (express local)</h2>
        <p>
          Where we operate express service, we target delivery in approximately <strong>20 minutes to 2 hours</strong>{" "}
          from confirmation, subject to traffic, weather, order volume, and your pincode. Exact fees, slots, and
          any minimum order for free delivery are shown at checkout. Full detail:{" "}
          <Link href="/shipping" className="text-green-600 hover:underline font-medium">
            Shipping Info
          </Link>
          . Risk passes to you when the order is handed over at the address provided (unless the law says
          otherwise).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">6. Returns &amp; quality</h2>
        <p>
          Fresh fruit is fragile; please see our{" "}
          <Link href="/returns" className="text-green-600 hover:underline font-medium">
            Returns Policy
          </Link>{" "}
          for quality issues, wrong items, and refunds. “Change of mind” after acceptable delivery is generally
          not available for perishables.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">7. Food safety</h2>
        <p>
          Wash fruit before eating. Store as advised on the pack or product page where provided. We are not liable
          for improper storage after delivery.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">8. Limitation of liability</h2>
        <p>
          To the maximum extent allowed by law, we are not liable for indirect losses. Our total liability for a
          given order is limited to what you paid for that order, except where the law does not allow such a cap.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">9. Governing law</h2>
        <p>
          These terms are governed by the laws of <strong>India</strong>. Courts at Mumbai, Maharashtra shall have
          jurisdiction, without prejudice to mandatory consumer rights in your state.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">10. Contact</h2>
        <p>
          Questions? Email{" "}
          <a href="mailto:support@freshfruit.com" className="text-green-600 hover:underline">
            support@freshfruit.com
          </a>{" "}
          or visit{" "}
          <Link href="/contact" className="text-green-600 hover:underline">
            Contact
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
