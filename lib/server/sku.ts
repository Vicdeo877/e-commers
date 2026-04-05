import { prisma } from "@/lib/prisma";

/**
 * Next sequential SKU: `{prefix}{0001}` scanning existing products whose `sku` matches `prefix` + digits.
 */
export async function generateNextSku(rawPrefix: string): Promise<string> {
  const prefix = (rawPrefix || "BF-").trim() || "BF-";
  const rows = await prisma.product.findMany({
    where: { sku: { startsWith: prefix } },
    select: { sku: true },
  });
  let max = 0;
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${escaped}(\\d+)$`);
  for (const { sku } of rows) {
    if (!sku) continue;
    const m = sku.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n)) max = Math.max(max, n);
    }
  }
  const next = max + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}
