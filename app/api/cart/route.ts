import { jsonOk } from "@/lib/server/http";
import { loadCartLines, cartLinesToApi } from "@/lib/server/cart";

export async function GET() {
  try {
    const cart = await loadCartLines();
    const items = cart ? cartLinesToApi(cart) : [];
    return jsonOk({ items });
  } catch (e) {
    console.error(e);
    return jsonOk({ items: [] });
  }
}
