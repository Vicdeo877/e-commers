/** Shared theme helpers (hex validation + hover shade for CSS variables). */

export function normalizeHexColor(input: string): string {
  const s = input.trim();
  if (/^#[0-9A-Fa-f]{3}$/.test(s) || /^#[0-9A-Fa-f]{6}$/.test(s) || /^#[0-9A-Fa-f]{8}$/.test(s)) {
    return s;
  }
  return "#16a34a";
}

function expandShortHex(hex: string): string {
  if (hex.length === 4 && hex[0] === "#") {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return hex;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const n = normalizeHexColor(hex);
  const h = expandShortHex(n.length === 7 ? n : n.slice(0, 7));
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

export function darkenHex(hex: string, amount = 0.12): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#15803d";
  const f = (c: number) => Math.round(c * (1 - amount));
  const r = f(rgb.r);
  const g = f(rgb.g);
  const b = f(rgb.b);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
