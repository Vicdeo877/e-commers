"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { getCart, addToCart, updateCart, removeFromCart } from "@/lib/api";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { trackAddToCartEcommerce } from "@/lib/analytics-track";
import toast from "react-hot-toast";

export interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image_main?: string;
  slug?: string;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  loading: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  refresh: () => Promise<CartItem[]>;
  add: (
    product_id: number,
    quantity?: number,
    opts?: { openDrawer?: boolean }
  ) => Promise<boolean>;
  update: (product_id: number, quantity: number) => Promise<void>;
  remove: (product_id: number) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { settings } = useSiteSettings();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currency = settings?.payment?.currency ?? "INR";

  const refresh = useCallback(async (): Promise<CartItem[]> => {
    try {
      const data = await getCart();
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      return list;
    } catch {
      setItems([]);
      return [];
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (product_id: number, quantity = 1, opts?: { openDrawer?: boolean }) => {
      setLoading(true);
      try {
        await addToCart(product_id, quantity);
        const list = await refresh();
        const line = list.find((i) => i.product_id === product_id);
        if (line) {
          trackAddToCartEcommerce({
            currency,
            value: Number(line.price) * quantity,
            productId: product_id,
            productName: line.name,
            quantity,
          });
        }
        toast.success("Added to cart");
        if (opts?.openDrawer !== false) {
          setDrawerOpen(true);
        }
        return true;
      } catch {
        toast.error("Failed to add to cart");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refresh, currency]
  );

  const update = useCallback(
    async (product_id: number, quantity: number) => {
      setLoading(true);
      try {
        await updateCart(product_id, quantity);
        await refresh();
      } catch {
        toast.error("Failed to update cart");
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const remove = useCallback(
    async (product_id: number) => {
      setLoading(true);
      try {
        await removeFromCart(product_id);
        await refresh();
        toast.success("Removed from cart");
      } catch {
        toast.error("Failed to remove item");
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        total,
        loading,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        refresh,
        add,
        update,
        remove,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
