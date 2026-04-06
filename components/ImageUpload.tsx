"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon, Link as LinkIcon, Globe } from "lucide-react";
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
  const [mode, setMode] = useState<"upload" | "url">(value?.startsWith("http") ? "url" : "upload");
  const [urlInput, setUrlInput] = useState(value?.startsWith("http") ? value : "");

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

  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    setPreview(val);
    onChange(val);
  };

  const clear = () => {
    setPreview("");
    setUrlInput("");
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const imgSrc = preview || (value ? imgUrl(value) : null);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        {label && <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>}
        <div className="flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${mode === "upload" ? "bg-white dark:bg-gray-700 text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Upload className="w-3 h-3 inline mr-1" /> UPLOAD
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${mode === "url" ? "bg-white dark:bg-gray-700 text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <LinkIcon className="w-3 h-3 inline mr-1" /> URL
          </button>
        </div>
      </div>

      {imgSrc ? (
        /* Preview */
        <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-card group shadow-sm bg-gray-50 dark:bg-gray-900">
          <img
            src={imgSrc}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-contain"
            onError={() => {
              if (mode === "url") toast.error("Invalid image URL");
              setPreview("");
            }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
            {mode === "upload" && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="bg-white text-gray-800 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-primary hover:text-white transition-all shadow-lg"
              >
                <Upload className="w-4 h-4" /> Change
              </button>
            )}
            <button
              type="button"
              onClick={clear}
              className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-red-600 transition-all shadow-lg"
            >
              <X className="w-4 h-4" /> Remove
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-[10px] font-bold text-white uppercase tracking-widest">Uploading…</p>
            </div>
          )}
        </div>
      ) : mode === "upload" ? (
        /* Drop zone */
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="w-full h-44 rounded-2xl border-2 border-dashed border-card hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-gray-400 group"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Uploading…</p>
            </div>
          ) : (
            <>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Click or drag to upload</p>
                <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mt-1">JPG, PNG, WEBP — max 5 MB</p>
              </div>
            </>
          )}
        </div>
      ) : (
        /* URL input zone */
        <div className="w-full h-44 rounded-2xl border-2 border-dashed border-card bg-gray-50/50 dark:bg-gray-800/30 flex flex-col items-center justify-center p-6 gap-4">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl text-primary shadow-sm">
            <Globe className="w-8 h-8" />
          </div>
          <div className="w-full max-w-xs space-y-2">
            <p className="text-center text-sm font-bold text-gray-500 dark:text-gray-400">External Image URL</p>
            <input
              type="text"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-500"
            />
            <p className="text-[10px] text-center text-gray-400 leading-relaxed">Paste a direct link to an image. Ensure the URL is public and hosted on a fast server.</p>
          </div>
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
