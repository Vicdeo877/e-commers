"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  adminGetOffersAdmin,
  adminCreateOffer,
  adminUpdateOffer,
  adminDeleteOffer,
} from "@/lib/api";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

function offerRequestErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const m = err.response?.data?.message;
    if (typeof m === "string" && m.trim()) return m;
    if (err.response?.status === 403) return "Admin access required — sign in again.";
    if (err.response?.status === 401) return "Session expired — sign in again.";
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

interface OfferRow {
  id: number;
  title: string;
  description: string;
  coupon_code?: string;
  discount_value: number;
  sort_order: number;
  highlight: boolean;
  is_active: boolean;
}

interface OfferForm {
  title: string;
  description: string;
  coupon_code: string;
  discount_value: string;
  sort_order: string;
  highlight: boolean;
  is_active: boolean;
}

const empty: OfferForm = {
  title: "",
  description: "",
  coupon_code: "",
  discount_value: "0",
  sort_order: "0",
  highlight: false,
  is_active: true,
};

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<OfferRow | null>(null);
  const [form, setForm] = useState<OfferForm>(empty);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetOffersAdmin()
      .then((d) => setOffers(Array.isArray(d) ? d : []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setShowModal(true);
  };

  const openEdit = (o: OfferRow) => {
    setEditing(o);
    setForm({
      title: o.title,
      description: o.description,
      coupon_code: o.coupon_code ?? "",
      discount_value: String(o.discount_value ?? 0),
      sort_order: String(o.sort_order ?? 0),
      highlight: o.highlight,
      is_active: o.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        coupon_code: form.coupon_code.trim() || undefined,
        discount_value: parseFloat(form.discount_value) || 0,
        sort_order: parseInt(form.sort_order || "0", 10) || 0,
        highlight: form.highlight,
        is_active: form.is_active,
      };
      if (editing) {
        await adminUpdateOffer(editing.id, payload);
        toast.success("Offer updated");
      } else {
        await adminCreateOffer(payload);
        toast.success("Offer created");
      }
      load();
      setShowModal(false);
    } catch (err: unknown) {
      toast.error(offerRequestErrorMessage(err, "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (o: OfferRow) => {
    if (!window.confirm(`Delete “${o.title}”?`)) return;
    try {
      await adminDeleteOffer(o.id);
      toast.success("Deleted");
      load();
    } catch (err: unknown) {
      toast.error(offerRequestErrorMessage(err, "Failed to delete"));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Offers & Deals</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage promotional cards shown on the homepage hero strip.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-primary/20 uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" /> Add Offer
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card rounded-2xl h-24 animate-pulse border border-card" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-card rounded-2xl border border-card shadow-sm p-16 text-center text-gray-500">
          <p className="font-bold text-lg text-foreground mb-1">No active offers</p>
          <p className="text-sm opacity-60">Populate the homepage “Offers & Deals” section by creating your first card.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-card">
              <tr>
                {["Order", "Offer Details", "Coupon", "Status", "Visibility", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-card">
              {offers.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 text-primary font-bold font-mono text-xs">{o.sort_order}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground">{o.title}</p>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5 italic">{o.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    {o.coupon_code ? (
                      <span className="font-mono text-[10px] font-bold bg-amber-500/10 text-amber-600 px-2 py-1 rounded-lg border border-amber-500/20 uppercase">
                        {o.coupon_code}
                      </span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-700 italic text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {o.highlight ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        <Sparkles className="w-3 h-3" /> Featured
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest opacity-40">Standard</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border transition-all ${
                        o.is_active ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200" : "bg-gray-100 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-200"
                      }`}
                    >
                      {o.is_active ? "Live" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Edit Offer"
                        onClick={() => openEdit(o)}
                        className="p-2.5 rounded-xl hover:bg-primary/10 text-primary transition-all border border-transparent hover:border-primary/20"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete Offer"
                        onClick={() => void handleDelete(o)}
                        className="p-2.5 rounded-xl hover:bg-red-500/10 text-red-500 transition-all border border-transparent hover:border-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in">
          <div
            className="bg-card rounded-2xl shadow-2xl border border-card max-w-lg w-full max-h-[90vh] overflow-y-auto p-8"
            role="dialog"
            aria-labelledby="offer-modal-title"
          >
            <h2 id="offer-modal-title" className="text-xl font-bold text-foreground mb-8">
              {editing ? "Refine Offer" : "New Promotional Deal"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Offer Headline *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  placeholder="e.g. Free shipping over ₹500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Full Description *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all resize-none italic leading-relaxed"
                  placeholder="Appears prominently in the offer card..."
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Optional Code</label>
                  <input
                    value={form.coupon_code}
                    onChange={(e) => setForm((f) => ({ ...f, coupon_code: e.target.value.toUpperCase() }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm font-mono text-amber-500 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all uppercase"
                    placeholder="WELCOME10"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Display Value</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.discount_value}
                    onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Display Priority</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm max-w-[120px] outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                />
                <p className="text-[10px] text-gray-400 mt-2 italic opacity-60">Successive offers are sorted by this value (1, 2, 3...)</p>
              </div>
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20 transition-all hover:bg-amber-500/10 group">
                  <input
                    type="checkbox"
                    checked={form.highlight}
                    onChange={(e) => setForm((f) => ({ ...f, highlight: e.target.checked }))}
                    className="w-5 h-5 rounded border-amber-500/30 text-amber-500 focus:ring-amber-500/20 bg-card"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-amber-600 group-hover:text-amber-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> High-Intensity Feature
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Adds visual badge and stronger highlights</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-card transition-colors hover:border-primary/20">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    className="w-5 h-5 rounded border-card text-primary focus:ring-primary/20 bg-card"
                  />
                  <span className="text-sm font-bold text-gray-500 hover:text-foreground italic">Publish immediately on storefront</span>
                </label>
              </div>
              <div className="flex gap-4 pt-8 border-t border-card">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-primary/20 min-w-[140px]"
                >
                  {saving ? "Saving…" : editing ? "Update Offer" : "Create Offer"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 font-bold text-[11px] uppercase tracking-widest px-4 hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
