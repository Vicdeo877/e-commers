import { jsonOk } from "@/lib/server/http";

/** Must run per-request so `.env` / deployment env is applied (not build-time prerender). */
export const dynamic = "force-dynamic";

/**
 * Tells the client whether Google OAuth is fully configured (client id + secret).
 * Used so the sign-in button can show without requiring NEXT_PUBLIC_GOOGLE_CLIENT_ID.
 */
export async function GET() {
  const enabled =
    Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim()) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());
  return jsonOk({ enabled });
}
