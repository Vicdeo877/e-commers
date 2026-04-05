/** Shared parsing for admin coupon create / update. */

export const COUPON_AUDIENCE_SEGMENTS = new Set([
  "all",
  "guest_only",
  "signed_in",
  "new_user",
  "mid_user",
  "old_user",
  "account_under_days",
  "account_over_days",
]);

export function optInt(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

export function parseAudienceSegment(raw: unknown): string {
  const s = String(raw ?? "all").toLowerCase();
  return COUPON_AUDIENCE_SEGMENTS.has(s) ? s : "all";
}
