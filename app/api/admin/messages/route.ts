import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = 20;

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: "desc" },
      }),
      prisma.contactMessage.count(),
    ]);

    return jsonOk({
      messages,
      pagination: {
        total,
        pages: Math.ceil(total / perPage),
        page,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to load messages", 500);
  }
}
