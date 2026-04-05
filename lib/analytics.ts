/** GA4 (G-xxx) or Universal Analytics (UA-xxxx-x) — used by admin API and storefront */
export function normalizeGoogleAnalyticsId(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (/^G-[A-Z0-9]{4,30}$/i.test(s)) return s;
  if (/^UA-\d{1,12}-\d{1,5}$/i.test(s)) return s;
  return null;
}

/** Meta Pixel ID — digits only, typical length 15–16 */
export function normalizeFacebookPixelId(raw: unknown): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length < 5 || digits.length > 20) return null;
  return digits;
}
