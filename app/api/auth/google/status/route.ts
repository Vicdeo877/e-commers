import { jsonOk } from "@/lib/server/http";
import { prisma } from "@/lib/prisma";

/** Must run per-request so database settings are applied. */
export const dynamic = "force-dynamic";

/**
 * Tells the client whether Google OAuth is fully configured (client id + secret).
 * Used so the sign-in button can show without requiring NEXT_PUBLIC_GOOGLE_CLIENT_ID.
 */
export async function GET() {
  const sec = await prisma.settingsSecurity.findFirst();
  
  const hasDbConfig = 
    (sec?.googleClientId?.trim() || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim()) &&
    (sec?.googleClientSecret?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim());

  // Google sign-in is considered enabled if the toggle is ON and credentials exist, 
  // or if credentials exist and no explicit OFF toggle is in DB (fallback/default).
  const enabled = (sec?.googleSignInEnabled ?? true) && !!hasDbConfig;

  return jsonOk({ enabled });
}
