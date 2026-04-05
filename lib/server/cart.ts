import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCartToken, cookieCart } from "@/lib/server/http";
import { getSessionUser } from "@/lib/server/auth";

const CART_MAX_AGE = 60 * 60 * 24 * 365;

export async function loadCartLines() {
  const user = await getSessionUser();
  const guest = getCartToken();

  if (user) {
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { lines: { include: { product: true } } },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
        include: { lines: { include: { product: true } } },
      });
    }
    return cart;
  }

  if (guest) {
    const cart = await prisma.cart.findUnique({
      where: { guestToken: guest },
      include: { lines: { include: { product: true } } },
    });
    if (cart) return cart;
  }

  return null;
}

/** Guest cart mutations: returns cart id and optional Set-Cookie for new guest token */
export async function ensureCartForMutation(): Promise<{ cartId: string; setCookie: string | null }> {
  const user = await getSessionUser();
  if (user) {
    let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) cart = await prisma.cart.create({ data: { userId: user.id } });
    return { cartId: cart.id, setCookie: null };
  }

  let token = getCartToken();
  if (!token) {
    token = randomUUID();
    const cart = await prisma.cart.create({ data: { guestToken: token } });
    return { cartId: cart.id, setCookie: cookieCart(token, CART_MAX_AGE) };
  }

  let cart = await prisma.cart.findUnique({ where: { guestToken: token } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { guestToken: token } });
  }
  return { cartId: cart.id, setCookie: null };
}

export function cartLinesToApi(cart: NonNullable<Awaited<ReturnType<typeof loadCartLines>>>) {
  return cart.lines.map((line) => ({
    id: line.id,
    product_id: line.productId,
    name: line.product.name,
    price: line.product.price,
    quantity: line.quantity,
    image_main: line.product.imageMain ?? undefined,
    slug: line.product.slug,
  }));
}
