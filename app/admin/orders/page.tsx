"use client";

import { useEffect, useState, useCallback } from "react";
import { adminGetOrders, adminUpdateOrderStatus } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Search, ChevronDown, ChevronUp, Download, Printer, RefreshCw, Filter, MapPin } from "lucide-react";
import { generateInvoicePDF, generateShippingSticker } from "@/lib/invoice";
import toast from "react-hot-toast";

const ALL_STATUSES = ["pending","confirmed","processing","shipped","out_for_delivery","delivered","cancelled","returned"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200/20",
  confirmed: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200/20",
  processing: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-200/20",
  shipped: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200/20",
  out_for_delivery: "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200/20",
  delivered: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200/20",
  cancelled: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200/20",
  returned: "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-200/20",
};

interface OrderItem { id: number; name: string; quantity: number; price: number; total: number; }
interface Order {
  id: number; order_number: string; total: number; subtotal: number;
  shipping_amount: number; discount_amount?: number;
  order_status: string; payment_status: string; payment_method: string;
  shipping_name?: string; shipping_phone?: string; shipping_address?: string;
  shipping_city?: string; shipping_state?: string; shipping_pincode?: string;
  customer_email?: string; coupon_code?: string; razorpay_payment_id?: string;
  tracking_number?: string; location_link?: string; created_at: string; updated_at?: string;
  items?: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<number, string>>({});
  const [paymentInputs, setPaymentInputs] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page) };
    if (q) params.q = q;
    if (statusFilter) params.status = statusFilter;
    adminGetOrders(params)
      .then((d) => { setOrders(d.orders ?? []); setTotal(d.pagination?.total ?? 0); })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [page, q, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (order: Order, newStatus: string) => {
    setUpdating(order.id);
    try {
      await adminUpdateOrderStatus(order.id, newStatus, trackingInputs[order.id], paymentInputs[order.id] ?? order.payment_status);
      toast.success("Status updated");
      load();
    } catch { toast.error("Failed to update"); }
    finally { setUpdating(null); }
  };

  const perPage = 25;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total orders</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-card px-4 py-2 rounded-xl hover:bg-card hover:text-primary transition-all shadow-sm">
          <RefreshCw className="w-3.5 h-3.5" /> Sync Orders
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-card shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 border border-card rounded-xl px-4 py-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Order ID / Consignee / Contact…" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-gray-500 font-medium" />
        </div>
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 border border-card rounded-xl px-4 py-1.5 min-w-[180px]">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm bg-transparent rounded-xl py-1.5 outline-none text-foreground font-bold uppercase tracking-wider flex-1">
            <option value="" className="dark:bg-gray-900">All Pipelines</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s} className="dark:bg-gray-900">{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        {(q || statusFilter) && (
          <button onClick={() => { setQ(""); setStatusFilter(""); setPage(1); }} className="text-sm text-red-500 hover:underline">Clear</button>
        )}
      </div>

      {/* Status pills summary */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["pending","processing","shipped","delivered","cancelled"].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(statusFilter === s ? "" : s); setPage(1); }}
            className={`text-[10px] px-4 py-1.5 rounded-full font-bold uppercase tracking-widest border transition-all shadow-sm ${statusFilter === s ? "ring-2 ring-offset-2 ring-primary/40 border-primary" : "border-card"} ${STATUS_COLORS[s] ?? "bg-gray-100 text-gray-500"}`}>
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-3xl border border-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 animate-pulse">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-card">
                <tr>
                  {["Flow ID", "Consignee", "Cart Content", "Revenue", "Settlement", "State", "Control"].map((h) => (
                    <th key={h} className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <>
                    <tr key={o.id} className="border-b border-card hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-foreground">#{o.order_number}</p>
                        <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString("en-IN")}</p>
                        {o.tracking_number && <p className="text-xs text-blue-500 mt-0.5">Tracking: {o.tracking_number}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{o.shipping_name ?? o.customer_email ?? "Guest"}</p>
                        {o.shipping_phone && <p className="text-xs text-gray-500">{o.shipping_phone}</p>}
                        {o.shipping_city && <p className="text-xs text-gray-500">{o.shipping_city}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {o.items?.slice(0, 2).map((item, i) => (
                          <div key={i}>{item.name} × {item.quantity}</div>
                        ))}
                        {(o.items?.length ?? 0) > 2 && <div className="text-gray-400/60">+{(o.items?.length ?? 0) - 2} more</div>}
                      </td>
                      <td className="px-4 py-3 font-bold text-primary">{formatPrice(o.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border border-opacity-10 ${o.payment_status === "paid" ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200" : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200"}`}>
                          {o.payment_status}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">{o.payment_method}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border border-opacity-10 ${STATUS_COLORS[o.order_status] ?? "bg-gray-100 border-gray-200"}`}>
                          {o.order_status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 items-center flex-wrap">
                          <select
                            value={o.order_status}
                            disabled={updating === o.id}
                            onChange={(e) => handleStatus(o, e.target.value)}
                            className="text-xs bg-gray-50 dark:bg-gray-800 border border-card rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary/30 text-foreground disabled:opacity-60 transition-all"
                          >
                            {ALL_STATUSES.map((s) => <option key={s} value={s} className="dark:bg-gray-900">{s.replace(/_/g, " ")}</option>)}
                          </select>
                          <button onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-foreground transition-colors" title="Toggle details">
                            {expanded === o.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button onClick={() => generateInvoicePDF(o)}
                            className="p-1 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="Download Invoice">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => generateShippingSticker(o)}
                            className="p-1 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors" title="Print Shipping Sticker">
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded row */}
                    {expanded === o.id && (
                      <tr key={`${o.id}-exp`} className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-card">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid sm:grid-cols-2 gap-8">
                            {/* Items */}
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Order Items</p>
                              <div className="space-y-2">
                                {o.items?.map((item) => (
                                  <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-gray-500">{item.name} <span className="text-xs opacity-60">× {item.quantity}</span></span>
                                    <span className="font-semibold text-foreground">{formatPrice(item.total)}</span>
                                  </div>
                                ))}
                                <div className="border-t border-card pt-2 mt-2 space-y-1 text-xs text-gray-500">
                                  <div className="flex justify-between"><span>Shipping</span><span className="text-foreground">{Number(o.shipping_amount) === 0 ? "FREE" : formatPrice(o.shipping_amount)}</span></div>
                                  <div className="flex justify-between font-bold text-primary text-base pt-1"><span>Total</span><span>{formatPrice(o.total)}</span></div>
                                </div>
                              </div>
                            </div>
                            {/* Address + Tracking */}
                            <div className="space-y-5">
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Shipping Information</p>
                                <p className="text-sm font-semibold text-foreground">{o.shipping_name}</p>
                                <p className="text-sm text-gray-500">{o.shipping_phone}</p>
                                <p className="text-sm text-gray-500 mt-1">{o.shipping_address}, {o.shipping_city}, {o.shipping_state} {o.shipping_pincode}</p>
                                {o.location_link && (
                                  <a
                                    href={o.location_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-emerald-500/20"
                                  >
                                    <MapPin className="w-3.5 h-3.5" /> View Location on Map
                                  </a>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Shipment Tracking</p>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Enter tracking number…"
                                    value={trackingInputs[o.id] ?? o.tracking_number ?? ""}
                                    onChange={(e) => setTrackingInputs((p) => ({ ...p, [o.id]: e.target.value }))}
                                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                                  />
                                  <button
                                    onClick={() => handleStatus(o, o.order_status)}
                                    disabled={updating === o.id}
                                    className="bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-60 transition-all shadow-sm shadow-primary/20"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Update Payment Status</p>
                                <div className="flex gap-2">
                                  <select
                                    value={paymentInputs[o.id] ?? o.payment_status}
                                    onChange={(e) => setPaymentInputs((p) => ({ ...p, [o.id]: e.target.value }))}
                                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                                  >
                                    <option value="pending" className="dark:bg-gray-900">Pending</option>
                                    <option value="paid" className="dark:bg-gray-900">Paid</option>
                                    <option value="failed" className="dark:bg-gray-900">Failed</option>
                                    <option value="refunded" className="dark:bg-gray-900">Refunded</option>
                                  </select>
                                  <button
                                    onClick={() => handleStatus(o, o.order_status)}
                                    disabled={updating === o.id}
                                    className="bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-60 transition-all shadow-sm shadow-primary/20"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                              {o.razorpay_payment_id && (
                                <p className="text-xs text-gray-400">Payment ID: {o.razorpay_payment_id}</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-1.5 text-sm border border-card rounded-xl hover:bg-card hover:text-primary transition-all disabled:opacity-40">Previous</button>
          <span className="text-sm font-semibold text-gray-500">{page} <span className="opacity-40 mx-1">of</span> {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-1.5 text-sm border border-card rounded-xl hover:bg-card hover:text-primary transition-all disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
