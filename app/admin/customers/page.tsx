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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" /> Customers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} registered customers</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-card px-4 py-2 rounded-xl hover:bg-card hover:text-primary transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh CRM
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-card shadow-sm p-4 mb-4 flex flex-wrap gap-3">
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
            className="w-full bg-gray-50 dark:bg-gray-800/50 border border-card rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-gray-500 transition-all font-medium"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setPage(1);
            setQ(searchInput.trim());
          }}
          className="bg-primary hover:bg-primary-hover text-white px-8 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20 uppercase tracking-widest"
        >
          Execute Search
        </button>
      </div>

          <div className="bg-card rounded-3xl border border-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-card">
                <tr>
                  <th className="text-left py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Identitiy Profile</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Direct Contact</th>
                  <th className="text-center py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Flow Vol</th>
                  <th className="text-center py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Geo Nodes</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Node Created</th>
                  <th className="text-center py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Status</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Controls</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-card hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">{r.full_name}</p>
                      <p className="text-xs text-gray-500">@{r.username}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="flex items-center gap-1 text-gray-500 italic">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {r.email}
                      </p>
                      {r.phone && (
                        <p className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                          <Phone className="w-3 h-3 shrink-0 opacity-50" /> {r.phone}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-foreground">{r.order_count}</td>
                    <td className="py-3 px-4 text-center font-bold text-foreground">{r.address_count}</td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(r.id, r.is_active)}
                        disabled={statusUpdating === r.id}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border transition-all ${r.is_active ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200/50' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200/50'}`}
                      >
                        {r.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(r.id)}
                        className="text-primary hover:text-primary-hover font-bold text-xs uppercase tracking-widest transition-colors"
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-card bg-gray-50/30 dark:bg-gray-800/20">
            <p className="text-xs font-semibold text-gray-500">
              Page {page} <span className="opacity-40 mx-0.5">of</span> {totalPages}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                title="Previous page"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-card hover:bg-card hover:text-primary transition-all disabled:opacity-20"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                title="Next page"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl border border-card hover:bg-card hover:text-primary transition-all disabled:opacity-20"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm data-[state=open]:animate-in fade-in transition-all" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(100vw-2rem,520px)] max-h-[85vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 bg-card rounded-2xl shadow-2xl p-6 border border-card focus:outline-none">
            <Dialog.Title className="text-xl font-bold text-foreground mb-1">Customer Details</Dialog.Title>
            <Dialog.Description className="text-sm text-gray-500 mb-6">
              Full profile information and activity history
            </Dialog.Description>

            {detailLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
                <p className="text-xs text-gray-500 font-medium animate-pulse">Loading profile data…</p>
              </div>
            )}

            {!detailLoading && detail && (
              <div className="space-y-6 text-sm">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-foreground text-lg">{detail.full_name}</p>
                      <p className="text-primary text-sm font-medium">@{detail.username}</p>
                    </div>
                    <button
                      onClick={() => handleToggleActive(detail.id, detail.is_active)}
                      disabled={statusUpdating === detail.id}
                      className={`text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border transition-all shadow-sm ${detail.is_active ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200/50 hover:bg-red-500 hover:text-white' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200/50 hover:bg-green-500 hover:text-white'}`}
                    >
                      {detail.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div className="mt-4 space-y-2 text-gray-500">
                    <p className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-primary/50" /> {detail.email}
                    </p>
                    {detail.phone && (
                      <p className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-primary/50" /> {detail.phone}
                      </p>
                    )}
                    {detail.profile_address && (
                      <p className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-primary/50 shrink-0 mt-0.5" />
                        <span className="text-foreground/80 leading-snug">{detail.profile_address}</span>
                      </p>
                    )}
                    <p className="text-xs opacity-40 pt-1">
                      Registered on {new Date(detail.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> Saved Addresses
                  </h3>
                  {detail.addresses.length === 0 ? (
                    <p className="text-gray-500 italic text-xs">No saved addresses found.</p>
                  ) : (
                    <ul className="space-y-3">
                      {detail.addresses.map((a) => (
                        <li
                          key={a.id}
                          className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-4 border border-card shadow-sm transition-all hover:border-primary/20"
                        >
                          <div className="flex items-center justify-between mb-2">
                            {a.label && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{a.label}</span>
                            )}
                            {a.is_default && (
                              <span className="text-[9px] uppercase font-bold bg-green-500 text-white px-2 py-0.5 rounded-lg">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-foreground">{a.full_name}</p>
                          <p className="text-sm text-gray-500 leading-snug mt-1">{a.line1}</p>
                          <p className="text-sm text-gray-500">
                            {a.city}, {a.state} {a.pincode}
                          </p>
                          <p className="text-xs text-primary font-medium mt-2 flex items-center gap-1.5">
                            <Phone className="w-3 h-3" /> {a.phone}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-primary" /> Purchase History
                  </h3>
                  {detail.orders.length === 0 ? (
                    <p className="text-gray-500 italic text-xs">No orders placed yet.</p>
                  ) : (
                    <div className="bg-gray-50/30 dark:bg-gray-800/30 rounded-2xl border border-card overflow-hidden">
                      <ul className="divide-y divide-card">
                        {detail.orders.map((o) => (
                          <li key={o.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-card transition-colors">
                            <Link
                              href={`/admin/orders`}
                              className="text-primary hover:text-primary-hover font-mono text-xs font-bold tracking-tight"
                              onClick={() => setDetailOpen(false)}
                            >
                              #{o.order_number}
                            </Link>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${o.order_status === 'delivered' ? 'bg-green-100 dark:bg-green-500/10 text-green-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{o.order_status}</span>
                            <span className="font-bold text-foreground text-sm">₹{Number(o.total).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Dialog.Close asChild>
              <button
                type="button"
                className="mt-8 w-full py-3 rounded-xl border border-card text-gray-500 font-bold text-xs uppercase tracking-widest hover:bg-card hover:text-foreground transition-all shadow-sm"
              >
                Close Profile
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
