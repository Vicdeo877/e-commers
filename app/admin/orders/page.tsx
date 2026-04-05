"use client";

import { useEffect, useState, useCallback } from "react";
import { adminGetOrders, adminUpdateOrderStatus } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Search, ChevronDown, ChevronUp, Download, Printer, RefreshCw, Filter } from "lucide-react";
import { generateInvoicePDF, generateShippingSticker } from "@/lib/invoice";
import toast from "react-hot-toast";

const ALL_STATUSES = ["pending","confirmed","processing","shipped","out_for_delivery","delivered","cancelled","returned"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700", shipped: "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-orange-100 text-orange-700", delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700", returned: "bg-gray-100 text-gray-600",
};

interface OrderItem { id: number; name: string; quantity: number; price: number; total: number; }
interface Order {
  id: number; order_number: string; total: number; subtotal: number;
  shipping_amount: number; discount_amount?: number;
  order_status: string; payment_status: string; payment_method: string;
  shipping_name?: string; shipping_phone?: string; shipping_address?: string;
  shipping_city?: string; shipping_state?: string; shipping_pincode?: string;
  customer_email?: string; coupon_code?: string; razorpay_payment_id?: string;
  tracking_number?: string; created_at: string; updated_at?: string;
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
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total orders</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Order no / name / phone…" className="bg-transparent text-sm outline-none flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm bg-gray-100 rounded-xl px-3 py-2 outline-none">
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        {(q || statusFilter) && (
          <button onClick={() => { setQ(""); setStatusFilter(""); setPage(1); }} className="text-sm text-red-500 hover:underline">Clear</button>
        )}
      </div>

      {/* Status pills summary */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["pending","processing","shipped","delivered","cancelled"].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(statusFilter === s ? "" : s); setPage(1); }}
            className={`text-xs px-3 py-1 rounded-full font-medium border transition-all ${statusFilter === s ? "ring-2 ring-offset-1 ring-gray-400" : ""} ${STATUS_COLORS[s] ?? "bg-gray-100 text-gray-600"}`}>
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 animate-pulse">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Order", "Customer", "Items", "Total", "Payment", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <>
                    <tr key={o.id} className="border-b hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-800">#{o.order_number}</p>
                        <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString("en-IN")}</p>
                        {o.tracking_number && <p className="text-xs text-blue-500 mt-0.5">Tracking: {o.tracking_number}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{o.shipping_name ?? o.customer_email ?? "Guest"}</p>
                        {o.shipping_phone && <p className="text-xs text-gray-400">{o.shipping_phone}</p>}
                        {o.shipping_city && <p className="text-xs text-gray-400">{o.shipping_city}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {o.items?.slice(0, 2).map((item, i) => (
                          <div key={i}>{item.name} × {item.quantity}</div>
                        ))}
                        {(o.items?.length ?? 0) > 2 && <div className="text-gray-400">+{(o.items?.length ?? 0) - 2} more</div>}
                      </td>
                      <td className="px-4 py-3 font-bold text-green-700">{formatPrice(o.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {o.payment_status}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">{o.payment_method}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.order_status] ?? "bg-gray-100"}`}>
                          {o.order_status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 items-center flex-wrap">
                          <select
                            value={o.order_status}
                            disabled={updating === o.id}
                            onChange={(e) => handleStatus(o, e.target.value)}
                            className="text-xs border rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-green-300 disabled:opacity-60"
                          >
                            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                          </select>
                          <button onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500" title="Toggle details">
                            {expanded === o.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button onClick={() => generateInvoicePDF(o)}
                            className="p-1 rounded-lg hover:bg-green-50 text-green-600" title="Download Invoice">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => generateShippingSticker(o)}
                            className="p-1 rounded-lg hover:bg-blue-50 text-blue-600" title="Print Shipping Sticker">
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded row */}
                    {expanded === o.id && (
                      <tr key={`${o.id}-exp`} className="bg-gray-50/80">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            {/* Items */}
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Items</p>
                              <div className="space-y-1">
                                {o.items?.map((item) => (
                                  <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-gray-700">{item.name} × {item.quantity}</span>
                                    <span className="font-medium">{formatPrice(item.total)}</span>
                                  </div>
                                ))}
                                <div className="border-t pt-1 mt-1 space-y-0.5 text-xs text-gray-500">
                                  <div className="flex justify-between"><span>Shipping</span><span>{Number(o.shipping_amount) === 0 ? "FREE" : formatPrice(o.shipping_amount)}</span></div>
                                  <div className="flex justify-between font-bold text-gray-800 text-sm"><span>Total</span><span>{formatPrice(o.total)}</span></div>
                                </div>
                              </div>
                            </div>
                            {/* Address + Tracking */}
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Ship To</p>
                                <p className="text-sm text-gray-700">{o.shipping_name} · {o.shipping_phone}</p>
                                <p className="text-sm text-gray-600">{o.shipping_address}, {o.shipping_city}, {o.shipping_state} {o.shipping_pincode}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Tracking Number</p>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Enter tracking number…"
                                    value={trackingInputs[o.id] ?? o.tracking_number ?? ""}
                                    onChange={(e) => setTrackingInputs((p) => ({ ...p, [o.id]: e.target.value }))}
                                    className="flex-1 border rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-300"
                                  />
                                  <button
                                    onClick={() => handleStatus(o, o.order_status)}
                                    disabled={updating === o.id}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-60"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Payment Status</p>
                                <div className="flex gap-2">
                                  <select
                                    value={paymentInputs[o.id] ?? o.payment_status}
                                    onChange={(e) => setPaymentInputs((p) => ({ ...p, [o.id]: e.target.value }))}
                                    className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-300 bg-white"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="failed">Failed</option>
                                    <option value="refunded">Refunded</option>
                                  </select>
                                  <button
                                    onClick={() => handleStatus(o, o.order_status)}
                                    disabled={updating === o.id}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-60"
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
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-40">Prev</button>
          <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
