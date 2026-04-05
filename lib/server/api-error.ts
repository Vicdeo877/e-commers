/** Safe message for JSON error responses (admin APIs). */
export function clientVisibleError(e: unknown, fallback: string): string {
  if (e instanceof Error) {
    const m = e.message;
    if (
      m.includes("no such column") ||
      m.includes("does not exist") ||
      m.includes("Unknown arg") ||
      m.includes("Unknown column")
    ) {
      return `${m} If you recently pulled code, run: npx prisma db push && npx prisma generate`;
    }
    return m;
  }
  return fallback;
}
