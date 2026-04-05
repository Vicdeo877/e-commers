"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, Eye, EyeOff } from "lucide-react";
import { register, login } from "@/lib/api";
import { GoogleSignInSection } from "@/components/GoogleSignInButton";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/context/AuthContext";
import toast from "react-hot-toast";

const oauthErrorMessages: Record<string, string> = {
  oauth_config: "Google sign-in is not configured on this server. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local.",
};

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", full_name: "", phone: "", password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (!err) return;
    toast.error(oauthErrorMessages[err] ?? `Sign-in error: ${err}`);
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    router.replace(url.pathname + url.search, { scroll: false });
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        full_name: form.full_name,
        phone: form.phone || undefined,
        password: form.password,
        confirm_password: form.confirm,
      });
      // Auto-login after registration
      const res = await login(form.email, form.password);
      const loggedInUser: User = res?.data?.user;
      if (loggedInUser) setUser(loggedInUser);
      toast.success("Account created! Welcome to BlissFruitz.");
      router.push("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "full_name", label: "Full Name", type: "text", placeholder: "Rahul Sharma", required: true },
    { name: "username", label: "Username", type: "text", placeholder: "rahul123", required: true },
    { name: "email", label: "Email", type: "email", placeholder: "rahul@example.com", required: true },
    { name: "phone", label: "Phone (optional)", type: "tel", placeholder: "+91 98765 43210", required: false },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-2xl mb-1">
            <Leaf className="w-7 h-7" /> BlissFruitz
          </div>
          <p className="text-gray-500 text-sm">Create your account</p>
        </div>

        <GoogleSignInSection nextPath="/" dividerLabel="or register with email" />

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="text-sm text-gray-600 mb-1 block">{f.label}</label>
              <input
                type={f.type}
                required={f.required}
                value={form[f.name as keyof typeof form]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
          ))}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 characters"
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300 pr-10"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Confirm Password</label>
            <input
              type="password"
              required
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="Re-enter password"
              className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold transition-colors"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-green-600 hover:underline font-medium">Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center text-gray-500 text-sm">
          Loading…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
