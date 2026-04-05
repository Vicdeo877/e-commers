import { prisma } from "@/lib/prisma";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { mapOffer } from "@/lib/server/mappers";

export async function GET() {
  try {
    const offers = await prisma.offer.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return jsonOk({ offers: offers.map(mapOffer) });
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to load offers", 500);
  }
}
