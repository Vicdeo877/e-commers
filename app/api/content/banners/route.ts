import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { mapBanner } from "@/lib/server/mappers";

export async function GET(req: NextRequest) {
  try {
    const placement = new URL(req.url).searchParams.get("placement") ?? "hero";

    const banners = await prisma.banner.findMany({
      where:
        placement === "all"
          ? {}
          : {
              placement,
              isActive: true,
            },
      orderBy: { sortOrder: "asc" },
    });

    return jsonOk({ banners: banners.map(mapBanner) });
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to load banners", 500);
  }
}
