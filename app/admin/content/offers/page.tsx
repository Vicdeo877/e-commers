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
          <h1 className="text-2xl font-bold text-gray-900">Offers &amp; deals</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Cards shown on the homepage amber strip. Turn on Highlight to feature an offer with a badge and stronger card styling.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add offer
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          <p className="font-medium mb-1">No offers yet</p>
          <p className="text-sm">Add offers to populate the homepage “Offers &amp; deals” section.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Order", "Title", "Coupon", "Highlight", "Active", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {offers.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-600 font-mono">{o.sort_order}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{o.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{o.description}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-amber-800">
                    {o.coupon_code ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {o.highlight ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3" /> Yes
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        o.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {o.is_active ? "Live" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => openEdit(o)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => void handleDelete(o)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
            role="dialog"
            aria-labelledby="offer-modal-title"
          >
            <h2 id="offer-modal-title" className="text-lg font-bold text-gray-900 mb-4">
              {editing ? "Edit offer" : "New offer"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  placeholder="e.g. Free shipping over ₹500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  placeholder="Short text shown under the title on the homepage"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Coupon code (optional)</label>
                  <input
                    value={form.coupon_code}
                    onChange={(e) => setForm((f) => ({ ...f, coupon_code: e.target.value.toUpperCase() }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm font-mono"
                    placeholder="WELCOME10"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Display value (₹ or % label)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.discount_value}
                    onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm"
                    placeholder="0"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">For display only; real discounts use Coupons.</p>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sort order</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm max-w-[120px]"
                />
                <p className="text-[11px] text-gray-400 mt-1">Lower numbers appear first.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.highlight}
                  onChange={(e) => setForm((f) => ({ ...f, highlight: e.target.checked }))}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-800">
                  Highlight on homepage (featured badge + stronger card)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-800">Show on storefront</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-5 py-2 rounded-xl text-sm font-semibold"
                >
                  {saving ? "Saving…" : editing ? "Save" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 text-sm px-4"
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
