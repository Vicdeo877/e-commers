"use client";

import { useEffect, useState } from "react";
import { adminGetAdmins, adminCreateAdminUser } from "@/lib/api";
import { UserCog, Plus, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface AdminRow {
  id: number;
  username: string;
  email: string;
  full_name: string;
  created_at: string;
}

const emptyForm = {
  email: "",
  username: "",
  full_name: "",
  phone: "",
  password: "",
  confirm_password: "",
};

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetAdmins()
      .then((d) => setAdmins(Array.isArray(d.admins) ? d.admins : []))
      .catch(() => setAdmins([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminCreateAdminUser({
        email: form.email.trim(),
        username: form.username.trim().toLowerCase(),
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        confirm_password: form.confirm_password,
      });
      toast.success("Admin user created");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Could not create admin user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserCog className="w-7 h-7 text-primary" /> Admin Users
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage system administrators and their access privileges.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-primary/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Admin account
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl border border-card shadow-sm p-6 mb-8 max-w-2xl"
        >
          <h2 className="font-bold text-foreground text-lg mb-6">Create New Administrator</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label htmlFor="admin-full-name" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                Full Name *
              </label>
              <input
                id="admin-full-name"
                required
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                placeholder="e.g. Priya Sharma"
              />
            </div>
            <div>
              <label htmlFor="admin-email" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                Email Address *
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="off"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                placeholder="admin2@store.local"
              />
            </div>
            <div>
              <label htmlFor="admin-username" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                Username *
              </label>
              <input
                id="admin-username"
                required
                autoComplete="off"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") }))
                }
                className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground font-mono transition-all"
                placeholder="priya_admin"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="admin-phone" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                Phone Number (optional)
              </label>
              <input
                id="admin-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                placeholder="+91 00000 00000"
              />
            </div>
            <div>
              <label htmlFor="admin-new-password" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                Password *
              </label>
              <div className="relative">
                <input
                  id="admin-new-password"
                  type={showPwd ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all pr-12"
                  placeholder="At least 8 chars"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="admin-confirm-password" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                Confirm Password *
              </label>
              <input
                id="admin-confirm-password"
                type={showPwd ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={form.confirm_password}
                onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                placeholder="Repeat password"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-card">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all min-w-[160px]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {saving ? "Creating…" : "Create Admin"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm);
              }}
              className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-card rounded-2xl border border-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-card bg-gray-50/50 dark:bg-gray-800/50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Authorized Administrators ({admins.length})</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin opacity-50" />
          </div>
        ) : admins.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-20 italic">No admin users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/30 dark:bg-gray-800/30">
                <tr className="text-left text-gray-400 border-b border-card">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest">Name</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest">Email</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest">Username</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card font-medium">
                {admins.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-foreground font-bold">{a.full_name}</td>
                    <td className="px-6 py-4 text-gray-500 italic">{a.email}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-[11px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-lg">
                        {a.username}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(a.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
