import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";

const DIR_MAP: Record<string, string> = {
  product: "products",
  banner: "banners",
  blog: "blog",
  category: "categories",
  branding: "branding",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ folder: string }> }
) {
  try {
    await requireAdmin();
    const { folder: key } = await params;
    const dirName = DIR_MAP[key];
    if (!dirName) return jsonErr("Invalid folder", 400);

    const formData = await req.formData();
    const file = formData.get("image");
    if (!file || !(file instanceof Blob)) return jsonErr("No image file", 400);

    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > 5 * 1024 * 1024) return jsonErr("File too large", 400);

    const ext = (file as File).name?.split(".").pop()?.toLowerCase();
    const safeExt = ext && ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? ext : "jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", dirName);
    await mkdir(uploadDir, { recursive: true });
    const fsPath = path.join(uploadDir, name);
    await writeFile(fsPath, buf);

    const url = `/uploads/${dirName}/${name}`;
    return jsonOk({ url });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Upload failed", 500);
  }
}
