"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/lib/api";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "", username: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setForm({ full_name: user.full_name ?? "", phone: user.phone ?? "", username: user.username ?? "" });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(form);
      await refresh();
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-bold text-gray-800 text-lg mb-5">Profile Information</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { name: "full_name", label: "Full Name", type: "text" },
          { name: "username", label: "Username", type: "text" },
          { name: "phone", label: "Phone", type: "tel" },
        ].map((f) => (
          <div key={f.name}>
            <label className="text-sm text-gray-600 mb-1 block">{f.label}</label>
            <input
              type={f.type}
              value={form[f.name as keyof typeof form]}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
              className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>
        ))}
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Email</label>
          <input type="email" value={user?.email ?? ""} disabled className="w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
