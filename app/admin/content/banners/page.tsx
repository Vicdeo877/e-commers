"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { adminCreateBanner, adminUpdateBanner, adminDeleteBanner } from "@/lib/api";
import { Plus, Pencil, Trash2, X, Image as ImageIcon } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import { imgUrl } from "@/lib/utils";
import AppImage from "@/components/AppImage";
import toast from "react-hot-toast";

interface Banner {
  id: number; title: string; subtitle?: string; image_path?: string;
  link_url?: string; placement: string; sort_order: number; is_active: boolean;
}
interface BannerForm {
  title: string; subtitle: string; image_path: string;
  link_url: string; placement: string; sort_order: string; is_active: boolean;
}

const empty: BannerForm = { title: "", subtitle: "", image_path: "", link_url: "/shop", placement: "hero", sort_order: "0", is_active: true };

const PLACEMENTS = ["hero", "offer", "sidebar", "footer"];

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerForm>(empty);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    // Fetch all placements
    api.get("/content/banners", { params: { placement: "hero" } })
      .then((r) => setBanners(Array.isArray(r.data?.data?.banners) ? r.data.data.banners : []))
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setShowModal(true); };
  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({ title: b.title, subtitle: b.subtitle ?? "", image_path: b.image_path ?? "", link_url: b.link_url ?? "/shop", placement: b.placement, sort_order: String(b.sort_order), is_active: b.is_active });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, sort_order: parseInt(form.sort_order || "0") };
      if (editing) {
        await adminUpdateBanner({ ...data, id: editing.id });
        toast.success("Banner updated!");
      } else {
        await adminCreateBanner(data);
        toast.success("Banner created!");
      }
      load(); setShowModal(false);
    } catch {
      toast.error("Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete banner "${title}"?`)) return;
    try { await adminDeleteBanner(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed to delete"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Banners</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hero images, offer strips and promo banners</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border" />)}</div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-25" />
          <p className="font-medium mb-1">No banners yet</p>
          <p className="text-sm">Click "Add Banner" to create your first banner.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {banners.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
              {/* Thumbnail */}
              <div className="w-32 h-24 shrink-0 relative overflow-hidden">
                <AppImage
                  src={b.image_path ? imgUrl(b.image_path) : null}
                  alt={b.title}
                  fill
                  className="object-cover"
                  placeholderName={b.title}
                  placeholderType="banner"
                />
              </div>
              {/* Info */}
              <div className="flex-1 px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-800">{b.title}</p>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded capitalize">{b.placement}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {b.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {b.subtitle && <p className="text-sm text-gray-500 line-clamp-1">{b.subtitle}</p>}
                  {b.link_url && <p className="text-xs text-blue-500 mt-0.5">{b.link_url}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(b.id, b.title)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* â”€â”€ Modal â”€â”€ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold text-gray-900 text-lg">{editing ? "Edit Banner" : "Add New Banner"}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Image */}
              <ImageUpload
                folder="banner"
                value={form.image_path}
                onChange={(url) => setForm((f) => ({ ...f, image_path: url }))}
                label="Banner Image"
              />

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Title *</label>
                <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Summer Sale 20% Off"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Subtitle / Description</label>
                <input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  placeholder="Short tagline shown below the title"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Link URL</label>
                  <input value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                    placeholder="/shop"
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Placement</label>
                <select value={form.placement} onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300">
                  {PLACEMENTS.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                <span className="text-gray-700">Active (shown on site)</span>
              </label>
              <div className="flex gap-3 pt-2 border-t">
                <button type="submit" disabled={saving}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  {saving ? "Savingâ€¦" : editing ? "Update Banner" : "Create Banner"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 text-sm px-4">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

