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
          <h1 className="text-2xl font-bold text-foreground">Site Banners</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hero images, offer strips and promo banners</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-primary/20 uppercase tracking-widest">
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="bg-card rounded-3xl h-28 animate-pulse border border-card" />)}</div>
      ) : banners.length === 0 ? (
        <div className="bg-card rounded-3xl border border-card shadow-sm p-16 text-center text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-300 dark:text-gray-700" />
          <p className="font-bold text-lg text-foreground mb-1">No banners configured</p>
          <p className="text-sm opacity-60">Click "Add Banner" to create your first visual promotion.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {banners.map((b) => (
            <div key={b.id} className="bg-card rounded-2xl border border-card shadow-sm overflow-hidden flex transition-all hover:shadow-md hover:border-primary/20 group">
              {/* Thumbnail */}
              <div className="w-40 h-28 shrink-0 relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                <AppImage
                  src={b.image_path ? (b.image_path.startsWith('http') ? b.image_path : imgUrl(b.image_path)) : null}
                  alt={b.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  placeholderName={b.title}
                  placeholderType="banner"
                />
              </div>
              {/* Info */}
              <div className="flex-1 px-5 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <p className="font-bold text-foreground text-lg">{b.title}</p>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2.5 py-1 rounded-lg border border-primary/20">{b.placement}</span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border transition-all ${b.is_active ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200" : "bg-gray-100 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400 border-gray-200"}`}>
                      {b.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {b.subtitle && <p className="text-sm text-gray-500 line-clamp-1 italic">{b.subtitle}</p>}
                  {b.link_url && <p className="text-[11px] font-mono font-medium text-gray-400 mt-1.5 opacity-60 hover:opacity-100 transition-opacity">{b.link_url}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(b)} className="p-2.5 rounded-xl hover:bg-primary/10 text-primary transition-all border border-transparent hover:border-primary/20"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(b.id, b.title)} className="p-2.5 rounded-xl hover:bg-red-500/10 text-red-500 transition-all border border-transparent hover:border-red-500/20"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* â”€â”€ Modal â”€â”€ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all animate-in fade-in">
          <div className="bg-card rounded-2xl shadow-2xl border border-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-card sticky top-0 bg-card">
              <h2 className="font-bold text-foreground text-xl">{editing ? "Edit Banner" : "New Visual Banner"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              {/* Image */}
              <ImageUpload
                folder="banner"
                value={form.image_path}
                onChange={(url) => setForm((f) => ({ ...f, image_path: url }))}
                label="Banner Image"
              />

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Display Title *</label>
                <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Summer Sale 20% Off"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Tagline / Description</label>
                <input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  placeholder="Shown below the title"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Action Link</label>
                  <input value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                    placeholder="/shop"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground font-mono transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Priority Ord.</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Site Placement</label>
                <select value={form.placement} onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all">
                  {PLACEMENTS.map((p) => <option key={p} value={p} className="capitalize dark:bg-gray-900">{p}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-card transition-colors hover:border-primary/20">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="w-5 h-5 rounded border-card text-primary focus:ring-primary/20 bg-card" />
                <span className="text-sm font-bold text-gray-500 hover:text-foreground">Banner is Active <span className="text-[10px] font-normal uppercase tracking-wide opacity-40 ml-1">(currently visible on site)</span></span>
              </label>
              <div className="flex gap-4 pt-6 border-t border-card">
                <button type="submit" disabled={saving}
                  className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
                  {saving ? "Saving…" : editing ? "Update Banner" : "Create Banner"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 font-bold text-xs uppercase tracking-widest px-4 hover:text-foreground transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

