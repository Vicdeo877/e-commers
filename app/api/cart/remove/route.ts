import { jsonOk, jsonErr, appendSetCookie } from "@/lib/server/http";
import { ensureCartForMutation } from "@/lib/server/cart";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product_id = Number(body.product_id);
    if (!Number.isFinite(product_id)) return jsonErr("Invalid product");

    const { cartId, setCookie } = await ensureCartForMutation();

    await prisma.cartLine.deleteMany({
      where: { cartId, productId: product_id },
    });

    let res = jsonOk({ message: "Removed" });
    if (setCookie) res = appendSetCookie(res, setCookie);
    return res;
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to remove", 500);
  }
}
