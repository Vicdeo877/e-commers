import { jsonOk } from "@/lib/server/http";
import { getMaintenanceMode } from "@/lib/server/settings";

/** Public read — used by storefront maintenance gate (no secrets) */
export async function GET() {
  const m = await getMaintenanceMode();
  return jsonOk(m);
}
