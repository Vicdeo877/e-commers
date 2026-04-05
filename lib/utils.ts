import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string) {
  return `₹${Number(amount).toFixed(2)}`;
}

export function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
}

const apiBase = () =>
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Resolves stored image paths for <img src>.
 * - Absolute URLs: unchanged
 * - /images/* : Next.js `public/images` (same origin as the app)
 * - /uploads/*, /assets/* : Express static files on the API host
 */
export function imgUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/images/")) return path;
  const base = apiBase();
  if (path.startsWith("/uploads/") || path.startsWith("/assets/")) return `${base}${path}`;
  if (path.startsWith("/")) return `${base}${path}`;
  return `${base}/${path}`;
}
