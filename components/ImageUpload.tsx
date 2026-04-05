"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { uploadImage } from "@/lib/api";
import { imgUrl } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props {
  folder: "product" | "banner" | "blog";
  value?: string;            // current image URL or path
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export default function ImageUpload({ folder, value, onChange, label = "Upload Image", className = "" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value ?? "");

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    // Local preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
      toast.success("Image uploaded!");
    } catch (err: unknown) {
      const msg = (err as Error).message ?? "Upload failed";
      toast.error(msg);
      setPreview(value ?? "");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clear = () => { setPreview(""); onChange(""); if (inputRef.current) inputRef.current.value = ""; };

  const imgSrc = preview || (value ? imgUrl(value) : null);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="text-xs text-gray-500 block">{label}</label>}

      {imgSrc ? (
        /* ── Preview ── */
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 group">
          <img
            src={imgSrc}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setPreview("")}
            loading="lazy"
          />
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-gray-100"
            >
              <Upload className="w-3.5 h-3.5" /> Change
            </button>
            <button
              type="button"
              onClick={clear}
              className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-red-600"
            >
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        /* ── Drop zone ── */
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="w-full h-40 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-400 hover:bg-green-50/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-gray-400"
        >
          {uploading ? (
            <><Loader2 className="w-7 h-7 animate-spin text-green-500" /><p className="text-xs text-green-600">Uploading…</p></>
          ) : (
            <><ImageIcon className="w-7 h-7" /><p className="text-sm font-medium">Click or drag to upload</p><p className="text-xs">JPG, PNG, WEBP — max 5 MB</p></>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
