import path from "path";

/** Resolves SQLite file path for `file:` DATABASE_URL (paths relative to `prisma/`). */
export function getSqliteDatabasePath(): string | null {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("file:")) return null;
  let p = url.slice("file:".length).split("?")[0];
  if (!p) return null;
  if (p.startsWith("/") || /^[A-Za-z]:[\\/]/.test(p)) {
    return path.normalize(p);
  }
  const rel = p.replace(/^\.\//, "");
  return path.normalize(path.join(process.cwd(), "prisma", rel));
}
