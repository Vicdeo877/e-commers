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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog className="w-7 h-7 text-green-600" />
            Admin users
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Create additional store admins. Only signed-in admins can access this page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          New admin
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8 max-w-2xl"
        >
          <h2 className="font-bold text-gray-800 mb-4">Create admin account</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="admin-full-name" className="text-xs text-gray-500 mb-1 block">
                Full name *
              </label>
              <input
                id="admin-full-name"
                required
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300"
                placeholder="e.g. Priya Sharma"
              />
            </div>
            <div>
              <label htmlFor="admin-email" className="text-xs text-gray-500 mb-1 block">
                Email *
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="off"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300"
                placeholder="admin2@store.local"
              />
            </div>
            <div>
              <label htmlFor="admin-username" className="text-xs text-gray-500 mb-1 block">
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
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300 font-mono"
                placeholder="priya_admin"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="admin-phone" className="text-xs text-gray-500 mb-1 block">
                Phone
              </label>
              <input
                id="admin-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300"
                placeholder="Optional"
              />
            </div>
            <div>
              <label htmlFor="admin-new-password" className="text-xs text-gray-500 mb-1 block">
                Password * (min 8 characters)
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
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300 pr-10"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="admin-confirm-password" className="text-xs text-gray-500 mb-1 block">
                Confirm password *
              </label>
              <input
                id="admin-confirm-password"
                type={showPwd ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={form.confirm_password}
                onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300"
                placeholder="Repeat password"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create admin
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm);
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-semibold text-gray-800">Store admins ({admins.length})</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-12 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : admins.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">No admin users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Username</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/80">
                    <td className="px-5 py-3 font-medium text-gray-900">{a.full_name}</td>
                    <td className="px-5 py-3 text-gray-600">{a.email}</td>
                    <td className="px-5 py-3 font-mono text-gray-600">{a.username}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(a.created_at).toLocaleString()}
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
