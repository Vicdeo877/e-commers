"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminGetCustomers, adminGetCustomer, adminUpdateCustomerStatus } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Users, Search, RefreshCw, Mail, Phone, MapPin, Package, Loader2,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

interface CustomerRow {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  profile_address?: string;
  created_at: string;
  order_count: number;
  address_count: number;
  is_active: boolean;
}

interface Address {
  id: number;
  label?: string | null;
  full_name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

interface CustomerDetail {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  profile_address?: string;
  created_at: string;
  is_active: boolean;
  addresses: Address[];
  orders: {
    id: number;
    order_number: string;
    total: number;
    order_status: string;
    payment_status: string;
    created_at: string;
  }[];
}

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);

  const handleToggleActive = async (id: number, current: boolean) => {
    setStatusUpdating(id);
    try {
      await adminUpdateCustomerStatus(id, !current);
      if (detail && detail.id === id) setDetail((prev) => prev ? { ...prev, is_active: !current } : null);
      setRows((prev) => prev.map((r) => r.id === id ? { ...r, is_active: !current } : r));
      toast.success(current ? "Customer deactivated" : "Customer activated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusUpdating(null);
    }
  };

  const perPage = 20;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page) };
    if (q.trim()) params.q = q.trim();
    adminGetCustomers(params)
      .then((d: { customers?: CustomerRow[]; pagination?: { total?: number } }) => {
        setRows(d.customers ?? []);
        setTotal(d.pagination?.total ?? 0);
      })
      .catch(() => {
        setRows([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page, q]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (id: number) => {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      const c = await adminGetCustomer(id);
      setDetail(c as CustomerDetail);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-green-600" /> Customers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} registered customers</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                setQ(searchInput.trim());
              }
            }}
            placeholder="Search name, email, phone…"
            className="w-full border rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setPage(1);
            setQ(searchInput.trim());
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          Search
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Contact</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">Orders</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">Addresses</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Joined</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/80">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{r.full_name}</p>
                      <p className="text-xs text-gray-500">@{r.username}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="flex items-center gap-1 text-gray-700">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {r.email}
                      </p>
                      {r.phone && (
                        <p className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                          <Phone className="w-3 h-3 shrink-0" /> {r.phone}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">{r.order_count}</td>
                    <td className="py-3 px-4 text-center font-medium">{r.address_count}</td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(r.id, r.is_active)}
                        disabled={statusUpdating === r.id}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${r.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                      >
                        {r.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(r.id)}
                        className="text-green-600 hover:underline font-medium"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                title="Previous page"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Next page"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(100vw-2rem,520px)] max-h-[85vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl p-6 border border-gray-100 focus:outline-none">
            <Dialog.Title className="text-lg font-bold text-gray-900 mb-1">Customer details</Dialog.Title>
            <Dialog.Description className="text-xs text-gray-500 mb-4">
              Profile, saved addresses, and recent orders
            </Dialog.Description>

            {detailLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              </div>
            )}

            {!detailLoading && detail && (
              <div className="space-y-6 text-sm">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-base">{detail.full_name}</p>
                      <p className="text-gray-500">@{detail.username}</p>
                    </div>
                    <button
                      onClick={() => handleToggleActive(detail.id, detail.is_active)}
                      disabled={statusUpdating === detail.id}
                      className={`text-[11px] px-3 py-1.5 rounded-full font-medium border transition-colors ${detail.is_active ? 'bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200' : 'bg-red-50 text-red-700 border-red-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'}`}
                    >
                      {detail.is_active ? 'Status: Active (Click to Deactivate)' : 'Status: Inactive (Click to Activate)'}
                    </button>
                  </div>
                  <div className="mt-2 space-y-1 text-gray-700">
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" /> {detail.email}
                    </p>
                    {detail.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" /> {detail.phone}
                      </p>
                    )}
                    {detail.profile_address && (
                      <p className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span>Profile: {detail.profile_address}</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Joined {new Date(detail.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" /> Saved addresses
                  </h3>
                  {detail.addresses.length === 0 ? (
                    <p className="text-gray-400 text-xs">No saved addresses.</p>
                  ) : (
                    <ul className="space-y-2">
                      {detail.addresses.map((a) => (
                        <li
                          key={a.id}
                          className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                        >
                          {a.label && (
                            <span className="text-xs font-medium text-green-700">{a.label}</span>
                          )}
                          {a.is_default && (
                            <span className="ml-2 text-[10px] uppercase bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                              Default
                            </span>
                          )}
                          <p className="font-medium text-gray-900 mt-1">{a.full_name}</p>
                          <p className="text-gray-600">{a.line1}</p>
                          <p className="text-gray-600">
                            {a.city}, {a.state} {a.pincode}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">{a.phone}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4 text-green-600" /> Recent orders
                  </h3>
                  {detail.orders.length === 0 ? (
                    <p className="text-gray-400 text-xs">No orders yet.</p>
                  ) : (
                    <ul className="space-y-1 max-h-48 overflow-y-auto">
                      {detail.orders.map((o) => (
                        <li key={o.id} className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-gray-50 last:border-0">
                          <Link
                            href={`/admin/orders`}
                            className="text-green-700 hover:underline font-mono"
                            onClick={() => setDetailOpen(false)}
                          >
                            #{o.order_number}
                          </Link>
                          <span className="text-gray-500">{o.order_status}</span>
                          <span className="font-medium">₹{Number(o.total).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <Dialog.Close asChild>
              <button
                type="button"
                className="mt-6 w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
              >
                Close
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
