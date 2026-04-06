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
          <h1 className="text-2xl font-bold text-foreground">Promo Coupons</h1>
          <p className="text-sm text-gray-500 mt-0.5">{coupons.length} active marketing rules</p>
        </div>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/20 uppercase tracking-widest">
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-3xl border border-card shadow-2xl p-8 mb-10 transition-all animate-in slide-in-from-top duration-300">
          <h2 className="font-bold text-foreground text-xl mb-8 border-b border-card pb-4">{editingId != null ? "Refine Marketing Rule" : "Forge New Coupon"}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Coupon Code *</label>
              <input required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SUMMER20"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground font-mono transition-all" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Description (optional)</label>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Shown in cart / offer lists"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Discount Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all">
                <option value="percent" className="dark:bg-gray-900">Percentage (%)</option>
                <option value="fixed" className="dark:bg-gray-900">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Value * ({form.type === "percent" ? "%" : "₹"})</label>
              <input required type="number" min="0.01" step="0.01" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder="20"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Min Order (₹)</label>
              <input type="number" min="0" value={form.min_order_amount} onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Max Discount (₹)</label>
              <input type="number" min="0" value={form.max_discount} onChange={(e) => setForm((f) => ({ ...f, max_discount: e.target.value }))}
                placeholder="No limit"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Usage Limit</label>
              <input type="number" min="1" value={form.usage_limit} onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
                placeholder="Unlimited"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Valid Until</label>
              <input type="datetime-local" value={form.valid_until} onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 border-t border-card pt-6 mt-2">
              <p className="text-sm font-bold text-foreground mb-1 uppercase tracking-wider">Audience Targeting</p>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Define who can use this coupon. Shoppers only see offers matching their account history.
              </p>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block" htmlFor="coupon-audience-segment">
                Segment
              </label>
              <select
                id="coupon-audience-segment"
                aria-label="Coupon audience segment"
                value={form.audience_segment}
                onChange={(e) => setForm((f) => ({ ...f, audience_segment: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all mb-2"
              >
                {AUDIENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="dark:bg-gray-900">
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] font-medium text-primary uppercase tracking-widest opacity-80">
                {AUDIENCE_OPTIONS.find((o) => o.value === form.audience_segment)?.hint}
              </p>
              {form.audience_segment === "mid_user" && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Min orders (optional)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.segment_min_orders}
                      onChange={(e) => setForm((f) => ({ ...f, segment_min_orders: e.target.value }))}
                      placeholder="Default 1"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Max orders (optional)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.segment_max_orders}
                      onChange={(e) => setForm((f) => ({ ...f, segment_max_orders: e.target.value }))}
                      placeholder="Default 3"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              )}
              {form.audience_segment === "old_user" && (
                <div className="mt-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Min lifetime orders (optional)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.segment_loyal_min_orders}
                    onChange={(e) => setForm((f) => ({ ...f, segment_loyal_min_orders: e.target.value }))}
                    placeholder="Default 4"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2 text-sm max-w-xs text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              )}
              {form.audience_segment === "account_under_days" && (
                <div className="mt-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Max account age (days)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.segment_max_account_age_days}
                    onChange={(e) => setForm((f) => ({ ...f, segment_max_account_age_days: e.target.value }))}
                    placeholder="Default 30"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2 text-sm max-w-xs text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              )}
              {form.audience_segment === "account_over_days" && (
                <div className="mt-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Min account age (days)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.segment_min_account_age_days}
                    onChange={(e) => setForm((f) => ({ ...f, segment_min_account_age_days: e.target.value }))}
                    placeholder="Default 90"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2 text-sm max-w-xs text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              )}
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3 pt-4 border-t border-card mt-2">
              <input
                type="checkbox"
                id="coupon-is-active"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="w-5 h-5 rounded border-card bg-gray-50 dark:bg-gray-800 text-primary focus:ring-primary/20"
              />
              <label htmlFor="coupon-is-active" className="text-sm font-bold text-gray-500 hover:text-foreground cursor-pointer transition-colors">
                Coupon is Active <span className="text-[10px] uppercase opacity-40 font-normal tracking-wide">(customers can use this item)</span>
              </label>
            </div>
          </div>
          <div className="flex gap-4 mt-10 pt-8 border-t border-card">
            <button type="submit" disabled={saving}
              className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white px-10 py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20 uppercase tracking-widest">
              {saving ? "Processing…" : editingId != null ? "Update Coupon" : "Activate Coupon"}
            </button>
            <button type="button" onClick={closeForm} className="text-gray-500 hover:text-foreground text-[10px] font-bold uppercase tracking-widest px-4 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="bg-card rounded-2xl h-16 animate-pulse border border-card" />)}</div>
      ) : coupons.length === 0 ? (
        <div className="bg-card rounded-3xl border border-card shadow-sm p-24 text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-card shadow-inner">
            <Tag className="w-10 h-10 text-gray-300 dark:text-gray-700" />
          </div>
          <p className="text-lg font-bold text-foreground mb-1">No promo rules established</p>
          <p className="text-sm text-gray-400 italic">Start scaling your business by creating your first discount coupon.</p>
        </div>
      ) : (
        <div className="bg-card rounded-3xl border border-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-card">
              <tr>
                {["Code", "Type", "Value", "Audience", "Min Order", "Used", "Expires", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-card">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/10 tracking-tight">{c.code}</span>
                      <button
                        type="button"
                        title="Copy code"
                        onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Copied!"); }}
                        className="text-gray-400 hover:text-primary transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 capitalize text-gray-500 font-medium">{c.type}</td>
                  <td className="px-4 py-4 font-bold text-foreground">{c.type === "percent" ? `${c.value}%` : formatPrice(c.value)}</td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded-lg border border-card shadow-sm">
                      {c.audience_segment ?? "all"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-500">{formatPrice(c.min_order_amount)}</td>
                  <td className="px-4 py-4 font-semibold text-foreground text-xs">{c.used_count}<span className="opacity-40 font-normal"> / {c.usage_limit || "∞"}</span></td>
                  <td className="px-4 py-4 text-[11px] text-gray-500 font-medium">
                    {c.valid_until ? new Date(c.valid_until).toLocaleDateString("en-IN") : "No expiry"}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border border-opacity-10 transition-all ${c.is_active ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200" : "bg-gray-100 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400 border-gray-200"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Edit coupon"
                        onClick={() => openEdit(c)}
                        className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-all shadow-sm border border-transparent hover:border-primary/20"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete coupon"
                        onClick={() => void handleDelete(c)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-all shadow-sm border border-transparent hover:border-red-500/20"
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
