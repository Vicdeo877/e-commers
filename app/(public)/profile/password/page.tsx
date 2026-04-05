"use client";

import { useState, useEffect } from "react";
import { changePassword, getProfile } from "@/lib/api";
import toast from "react-hot-toast";

export default function PasswordPage() {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => setHasPassword(p?.has_password ?? true))
      .catch(() => setHasPassword(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.new_password.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (hasPassword === null) {
      toast.error("Loading profile…");
      return;
    }
    if (hasPassword && !form.current_password) {
      toast.error("Enter your current password");
      return;
    }
    setLoading(true);
    try {
      await changePassword({
        ...(hasPassword ? { current_password: form.current_password } : {}),
        new_password: form.new_password,
      });
      toast.success(
        hasPassword
          ? "Password changed successfully"
          : "Password saved — you can also sign in with email now"
      );
      setHasPassword(true);
      setForm({ current_password: "", new_password: "", confirm: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-bold text-gray-800 text-lg mb-5">Change Password</h2>
      {hasPassword === false ? (
        <p className="text-sm text-gray-600 mb-4 max-w-sm">
          You signed in with Google. Set a password here if you also want to sign in with email and
          password.
        </p>
      ) : null}
      {hasPassword === null ? <p className="text-sm text-gray-500 mb-4">Loading…</p> : null}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        {hasPassword !== false ? (
          <>
            <div>
              <label className="text-sm text-gray-600 mb-1 block" htmlFor="pwd-current">
                Current Password
              </label>
              <input
                id="pwd-current"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.current_password}
                onChange={(e) => setForm((p) => ({ ...p, current_password: e.target.value }))}
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block" htmlFor="pwd-new">
                New Password (min 8 chars)
              </label>
              <input
                id="pwd-new"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.new_password}
                onChange={(e) => setForm((p) => ({ ...p, new_password: e.target.value }))}
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block" htmlFor="pwd-confirm">
                Confirm New Password
              </label>
              <input
                id="pwd-confirm"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Repeat new password"
                value={form.confirm}
                onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-sm text-gray-600 mb-1 block" htmlFor="pwd-oauth-new">
                New Password (min 8 chars)
              </label>
              <input
                id="pwd-oauth-new"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.new_password}
                onChange={(e) => setForm((p) => ({ ...p, new_password: e.target.value }))}
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block" htmlFor="pwd-oauth-confirm">
                Confirm New Password
              </label>
              <input
                id="pwd-oauth-confirm"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Repeat new password"
                value={form.confirm}
                onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
          </>
        )}
        <button
          type="submit"
          disabled={loading || hasPassword === null}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          {loading ? "Saving…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}
