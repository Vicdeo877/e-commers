import { readFileSync, existsSync } from "fs";
import { requireAdmin } from "@/lib/server/auth";
import { jsonErr } from "@/lib/server/http";
import { getSqliteDatabasePath } from "@/lib/server/sqlitePath";

export async function GET() {
  try {
    await requireAdmin();
    const dbPath = getSqliteDatabasePath();
    if (!dbPath) {
      return jsonErr("Export only supports SQLite (file:…) DATABASE_URL.", 400);
    }
    if (!existsSync(dbPath)) {
      return jsonErr("Database file not found on disk.", 404);
    }
    const buf = readFileSync(dbPath);
    const name = `blissfruits-backup-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.db`;
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Export failed", 500);
  }
}
