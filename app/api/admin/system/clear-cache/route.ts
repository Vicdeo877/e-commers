import { existsSync, rmSync } from "fs";
import { join } from "path";
import { requireAdmin } from "@/lib/server/auth";
import { jsonErr, jsonOk } from "@/lib/server/http";

export async function POST() {
  try {
    await requireAdmin();
    const allowed =
      process.env.NODE_ENV !== "production" || process.env.ALLOW_ADMIN_CACHE_CLEAR === "true";
    if (!allowed) {
      return jsonErr(
        "Clearing .next is disabled in production. Set ALLOW_ADMIN_CACHE_CLEAR=true in env, or run locally.",
        403
      );
    }
    const root = process.cwd();
    for (const name of [".next", ".next-dev"]) {
      const dir = join(root, name);
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
    return jsonOk({
      cleared: true,
      message:
        "Removed Next.js output folders (.next, .next-dev). Start dev again with npm run dev, or run npm run build for production.",
    });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Could not clear cache (files in use?)", 500);
  }
}
