"use client";

import { useEffect, useState } from "react";
import { adminGetCoupons, adminCreateCoupon, adminUpdateCoupon, adminDeleteCoupon } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Plus, Tag, Copy, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Coupon {
  id: number; code: string; type: string; value: number;
  description?: string;
  min_order_amount: number; max_discount?: number; usage_limit?: number;
  used_count: number; valid_from?: string; valid_until?: string; is_active: number;
  audience_segment?: string;
  segment_min_orders?: number;
  segment_max_orders?: number;
  segment_loyal_min_orders?: number;
  segment_max_account_age_days?: number;
  segment_min_account_age_days?: number;
}
interface CouponForm {
  code: string; type: string; value: string; min_order_amount: string;
  max_discount: string; usage_limit: string; valid_from: string; valid_until: string;
  audience_segment: string;
  segment_min_orders: string;
  segment_max_orders: string;
  segment_loyal_min_orders: string;
  segment_max_account_age_days: string;
  segment_min_account_age_days: string;
  description: string;
  is_active: boolean;
}

const AUDIENCE_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: "all", label: "Everyone (guests + logged in)", hint: "No shopper filter." },
  { value: "guest_only", label: "Guests only", hint: "Not logged in." },
  { value: "signed_in", label: "Logged-in only", hint: "Must have an account." },
  { value: "new_user", label: "New user (first purchase)", hint: "0 completed orders." },
  { value: "mid_user", label: "Mid user (order range)", hint: "Set min/max order counts below (defaults 1–3)." },
  { value: "old_user", label: "Loyal / high orders", hint: "Min completed orders (default 4+)." },
  { value: "account_under_days", label: "New account (≤ N days)", hint: "Max account age in days (default 30)." },
  { value: "account_over_days", label: "Established account (≥ N days)", hint: "Min account age in days (default 90)." },
];

const emptyForm: CouponForm = {
  code: "",
  type: "percent",
  value: "",
  min_order_amount: "0",
  max_discount: "",
  usage_limit: "",
  valid_from: "",
  valid_until: "",
  audience_segment: "all",
  segment_min_orders: "",
  segment_max_orders: "",
  segment_loyal_min_orders: "",
  segment_max_account_age_days: "",
  segment_min_account_age_days: "",
  description: "",
  is_active: true,
};

function isoToDatetimeLocal(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function couponToForm(c: Coupon): CouponForm {
  return {
    code: c.code,
    type: c.type,
    value: String(c.value),
    min_order_amount: String(c.min_order_amount ?? 0),
    max_discount: c.max_discount != null ? String(c.max_discount) : "",
    usage_limit: c.usage_limit != null ? String(c.usage_limit) : "",
    valid_from: "",
    valid_until: isoToDatetimeLocal(c.valid_until),
    audience_segment: c.audience_segment ?? "all",
    segment_min_orders: c.segment_min_orders != null ? String(c.segment_min_orders) : "",
    segment_max_orders: c.segment_max_orders != null ? String(c.segment_max_orders) : "",
    segment_loyal_min_orders: c.segment_loyal_min_orders != null ? String(c.segment_loyal_min_orders) : "",
    segment_max_account_age_days: c.segment_max_account_age_days != null ? String(c.segment_max_account_age_days) : "",
    segment_min_account_age_days: c.segment_min_account_age_days != null ? String(c.segment_min_account_age_days) : "",
    description: c.description ?? "",
    is_active: Boolean(c.is_active),
  };
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetCoupons()
      .then((d) => setCoupons(Array.isArray(d) ? d : []))
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const buildPayload = () => ({
    ...form,
    value: parseFloat(form.value),
    min_order_amount: parseFloat(form.min_order_amount || "0"),
    max_discount: form.max_discount ? parseFloat(form.max_discount) : undefined,
    usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : undefined,
    audience_segment: form.audience_segment,
    segment_min_orders: form.segment_min_orders.trim() || undefined,
    segment_max_orders: form.segment_max_orders.trim() || undefined,
    segment_loyal_min_orders: form.segment_loyal_min_orders.trim() || undefined,
    segment_max_account_age_days: form.segment_max_account_age_days.trim() || undefined,
    segment_min_account_age_days: form.segment_min_account_age_days.trim() || undefined,
    description: form.description.trim() || undefined,
    is_active: form.is_active,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingId != null) {
        await adminUpdateCoupon(editingId, payload);
        toast.success("Coupon updated!");
      } else {
        await adminCreateCoupon(payload);
        toast.success("Coupon created!");
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? (editingId != null ? "Failed to update coupon" : "Failed to create coupon"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Coupon) => {
    if (!window.confirm(`Delete coupon “${c.code}”? This cannot be undone.`)) return;
    try {
      await adminDeleteCoupon(c.id);
      toast.success("Coupon deleted");
      if (editingId === c.id) {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
      }
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Failed to delete coupon");
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm(couponToForm(c));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500 mt-0.5">{coupons.length} coupons</p>
        </div>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-gray-800 mb-4">{editingId != null ? "Edit coupon" : "New coupon"}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Coupon Code *</label>
              <input required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SUMMER20"
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300 font-mono" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Description (optional)</label>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Shown in cart / offer lists"
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Discount Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300">
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Value * ({form.type === "percent" ? "%" : "₹"})</label>
              <input required type="number" min="0.01" step="0.01" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder="20"
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Min Order (₹)</label>
              <input type="number" min="0" value={form.min_order_amount} onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Max Discount (₹)</label>
              <input type="number" min="0" value={form.max_discount} onChange={(e) => setForm((f) => ({ ...f, max_discount: e.target.value }))}
                placeholder="Leave blank for no limit"
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Usage Limit</label>
              <input type="number" min="1" value={form.usage_limit} onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
                placeholder="Leave blank for unlimited"
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Valid From</label>
              <input type="datetime-local" value={form.valid_from} onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Valid Until</label>
              <input type="datetime-local" value={form.valid_until} onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 border-t border-gray-100 pt-4 mt-1">
              <p className="text-sm font-semibold text-gray-800 mb-2">Who can use this coupon</p>
              <p className="text-xs text-gray-500 mb-3">
                Target new vs returning vs tenure. Shoppers only see offers that match their account (and cart still must meet min order).
              </p>
              <label className="text-xs text-gray-500 mb-1 block" htmlFor="coupon-audience-segment">
                Audience
              </label>
              <select
                id="coupon-audience-segment"
                aria-label="Coupon audience segment"
                value={form.audience_segment}
                onChange={(e) => setForm((f) => ({ ...f, audience_segment: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300 mb-2"
              >
                {AUDIENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mb-3">
                {AUDIENCE_OPTIONS.find((o) => o.value === form.audience_segment)?.hint}
              </p>
              {form.audience_segment === "mid_user" && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Min orders (optional)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.segment_min_orders}
                      onChange={(e) => setForm((f) => ({ ...f, segment_min_orders: e.target.value }))}
                      placeholder="Default 1"
                      className="w-full border rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Max orders (optional)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.segment_max_orders}
                      onChange={(e) => setForm((f) => ({ ...f, segment_max_orders: e.target.value }))}
                      placeholder="Default 3"
                      className="w-full border rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
              {form.audience_segment === "old_user" && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Min lifetime orders (optional)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.segment_loyal_min_orders}
                    onChange={(e) => setForm((f) => ({ ...f, segment_loyal_min_orders: e.target.value }))}
                    placeholder="Default 4"
                    className="w-full border rounded-xl px-3 py-2 text-sm max-w-xs"
                  />
                </div>
              )}
              {form.audience_segment === "account_under_days" && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Max account age (days)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.segment_max_account_age_days}
                    onChange={(e) => setForm((f) => ({ ...f, segment_max_account_age_days: e.target.value }))}
                    placeholder="Default 30"
                    className="w-full border rounded-xl px-3 py-2 text-sm max-w-xs"
                  />
                </div>
              )}
              {form.audience_segment === "account_over_days" && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Min account age (days)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.segment_min_account_age_days}
                    onChange={(e) => setForm((f) => ({ ...f, segment_min_account_age_days: e.target.value }))}
                    placeholder="Default 90"
                    className="w-full border rounded-xl px-3 py-2 text-sm max-w-xs"
                  />
                </div>
              )}
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="coupon-is-active"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="coupon-is-active" className="text-sm text-gray-800 cursor-pointer">
                Coupon is active (customers can use it)
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors">
              {saving ? (editingId != null ? "Saving…" : "Creating…") : editingId != null ? "Save changes" : "Create coupon"}
            </button>
            <button type="button" onClick={closeForm} className="text-gray-500 text-sm px-4">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl h-14 animate-pulse border" />)}</div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
          <Tag className="w-10 h-10 mx-auto mb-2 opacity-25" />
          <p>No coupons yet. Create your first coupon above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Code", "Type", "Value", "Audience", "Min Order", "Used", "Expires", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">{c.code}</span>
                      <button
                        type="button"
                        title="Copy code"
                        onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Copied!"); }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{c.type}</td>
                  <td className="px-4 py-3 font-semibold">{c.type === "percent" ? `${c.value}%` : formatPrice(c.value)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[140px]">
                    <span className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">
                      {c.audience_segment ?? "all"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatPrice(c.min_order_amount)}</td>
                  <td className="px-4 py-3 text-gray-600">{c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ""}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {c.valid_until ? new Date(c.valid_until).toLocaleDateString("en-IN") : "No expiry"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Edit coupon"
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete coupon"
                        onClick={() => void handleDelete(c)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
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
    </div>
  );
}
