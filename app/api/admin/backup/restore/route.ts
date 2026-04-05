import { copyFileSync, existsSync, unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";
import { requireAdmin } from "@/lib/server/auth";
import { jsonErr, jsonOk } from "@/lib/server/http";
import { getSqliteDatabasePath } from "@/lib/server/sqlitePath";
import { prisma } from "@/lib/prisma";

const SQLITE_MAGIC = Buffer.from("SQLite format 3\0");

function isSqliteBuffer(buf: Buffer): boolean {
  return buf.length >= 16 && buf.subarray(0, 16).equals(SQLITE_MAGIC);
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const dbPath = getSqliteDatabasePath();
    if (!dbPath) {
      return jsonErr("Restore only supports SQLite (file:…) DATABASE_URL.", 400);
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonErr('Expected form field "file" with a .db SQLite file.', 400);
    }

    const ab = await file.arrayBuffer();
    const buf = Buffer.from(ab);
    if (!isSqliteBuffer(buf)) {
      return jsonErr("File is not a valid SQLite database (wrong header).", 400);
    }

    const tmp = join(tmpdir(), `bf-restore-${randomBytes(8).toString("hex")}.db`);
    writeFileSync(tmp, buf);

    try {
      await prisma.$disconnect();
      if (existsSync(dbPath)) {
        copyFileSync(dbPath, `${dbPath}.pre-restore-${Date.now()}.bak`);
      }
      copyFileSync(tmp, dbPath);
      await prisma.$connect();
    } catch (err) {
      console.error(err);
      try {
        await prisma.$connect();
      } catch {
        /* ignore */
      }
      return jsonErr("Failed to write database file. Stop other processes using the DB and try again.", 500);
    } finally {
      try {
        unlinkSync(tmp);
      } catch {
        /* ignore */
      }
    }

    return jsonOk({
      message:
        "Database file replaced. Restart `npm run dev` if the app shows errors. A .pre-restore-*.bak copy of the previous file was kept next to the database.",
    });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Restore failed", 500);
  }
}
