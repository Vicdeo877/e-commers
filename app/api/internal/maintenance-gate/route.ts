import { jsonOk } from "@/lib/server/http";
import { getSessionUser } from "@/lib/server/auth";
import { getMaintenanceMode } from "@/lib/server/settings";

/**
 * Used by root middleware only — returns maintenance flag + whether the session is an admin.
 * Not secret: maintenance is public; admin flag is coarse (session-based).
 */
export async function GET() {
  const [user, m] = await Promise.all([getSessionUser(), getMaintenanceMode()]);
  return jsonOk({
    maintenance_enabled: m.enabled,
    is_admin: user?.role === "admin",
  });
}
