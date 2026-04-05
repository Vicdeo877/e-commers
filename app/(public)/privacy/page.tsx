import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | BlissFruitz",
  description:
    "How BlissFruitz protects your data when you order fresh fruits online for fast local delivery.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy">
      <p className="text-gray-600 border-l-4 border-green-500 pl-4 py-1 bg-green-50/80 rounded-r-lg">
        BlissFruitz sells <strong>fresh fruits</strong> online with{" "}
        <strong>quick local delivery (about 20 minutes–2 hours)</strong> where available. This policy explains what
        we collect and why.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">1. Information we collect</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Account &amp; delivery:</strong> name, mobile number, email, and saved addresses—needed to
            prepare your fruit order and reach you for fast delivery.
          </li>
          <li>
            <strong>Orders:</strong> items (e.g. fruit SKUs, quantities), totals, payment type, delivery
            instructions, and messages about your order status or delays.
          </li>
          <li>
            <strong>Location &amp; logistics:</strong> delivery pincode/area to confirm serviceability and ETA
            within our <strong>20 min–2 hour</strong> window where we operate.
          </li>
          <li>
            <strong>Technical:</strong> device/browser data, IP address, and cookies for login, cart, and site
            security.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">2. How we use your information</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Pick, pack, and dispatch fresh fruit orders and coordinate riders or partners.</li>
          <li>Send SMS/app/email updates about order confirmation, ETA, and delivery.</li>
          <li>Prevent fraud and keep our fruit marketplace safe.</li>
          <li>Improve our catalogue, pricing, and seasonal availability.</li>
          <li>Meet legal and tax obligations.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">3. Cookies &amp; local storage</h2>
        <p>
          We use cookies for sessions, cart, and preferences. Blocking cookies may break login or checkout.
          We do not use cookies to sell your contact list.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">4. Who we share with</h2>
        <p>
          We may share limited data with <strong>payment gateways</strong>, <strong>hosting</strong>, and{" "}
          <strong>delivery partners</strong> who help us fulfil fruit orders quickly. We do not sell your personal
          data to advertisers. Partners must use data only to provide their service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">5. Security</h2>
        <p>
          We apply reasonable security measures. No online service is 100% risk-free; please use a strong password
          for your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">6. Retention</h2>
        <p>
          We keep order and account data as needed for customer support, accounting, and legal retention, then
          delete or anonymise when appropriate.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">7. Your rights</h2>
        <p>
          You may request access, correction, or deletion of certain data where applicable law allows. Contact us
          below. You may also complain to a supervisory authority where relevant.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">8. Children</h2>
        <p>
          Ordering is intended for adults. We do not knowingly collect data from children under 13 for marketing.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">9. Changes</h2>
        <p>
          We may update this policy; the “Last updated” date will change. Continued use after notice means you
          accept the update where the law allows.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">10. Contact</h2>
        <p>
          Privacy questions:{" "}
          <a href="mailto:support@freshfruit.com" className="text-green-600 hover:underline">
            support@freshfruit.com
          </a>{" "}
          ·{" "}
          <Link href="/contact" className="text-green-600 hover:underline">
            Contact us
          </Link>
        </p>
      </section>
    </LegalPageShell>
  );
}
