import { jsonOk, jsonErr, appendSetCookie } from "@/lib/server/http";
import { ensureCartForMutation } from "@/lib/server/cart";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product_id = Number(body.product_id);
    const quantity = Math.max(1, Number(body.quantity) || 1);
    if (!Number.isFinite(product_id)) return jsonErr("Invalid product");

    const product = await prisma.product.findFirst({
      where: { id: product_id, isActive: true },
    });
    if (!product) return jsonErr("Product not found", 404);
    if (product.stockQuantity < quantity) return jsonErr("Not enough stock", 400);

    const { cartId, setCookie } = await ensureCartForMutation();

    const existing = await prisma.cartLine.findUnique({
      where: { cartId_productId: { cartId, productId: product_id } },
    });
    if (existing) {
      const nextQty = existing.quantity + quantity;
      if (nextQty > product.stockQuantity) return jsonErr("Not enough stock", 400);
      await prisma.cartLine.update({
        where: { id: existing.id },
        data: { quantity: nextQty },
      });
    } else {
      await prisma.cartLine.create({
        data: { cartId, productId: product_id, quantity },
      });
    }

    let res = jsonOk({ message: "Added" });
    if (setCookie) res = appendSetCookie(res, setCookie);
    return res;
  } catch (e) {
    console.error(e);
    return jsonErr("Failed to add to cart", 500);
  }
}
