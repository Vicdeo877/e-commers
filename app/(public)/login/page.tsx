"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, Eye, EyeOff } from "lucide-react";
import { login } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { GoogleSignInSection } from "@/components/GoogleSignInButton";

const oauthErrorMessages: Record<string, string> = {
  access_denied: "Google sign-in was cancelled.",
  oauth_state: "Sign-in session expired. Please try again.",
  google_signin: "Google sign-in failed. Try again or use email and password.",
  oauth_config:
    "Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local and restart the dev server.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const nextAfterLogin = searchParams.get("next") || "/";

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
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      // res = { success, message, data: { user: { id, full_name, email, role } } }
      const loggedInUser: User = res?.data?.user;
      if (!loggedInUser) throw new Error("No user in response");

      // Set user immediately — Navbar updates right away
      setUser(loggedInUser);
      toast.success(`Welcome back, ${loggedInUser.full_name}!`);
      const dest =
        loggedInUser.role === "admin"
          ? "/admin"
          : nextAfterLogin.startsWith("/")
            ? nextAfterLogin
            : "/";
      router.push(dest);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-2xl mb-1">
            <Leaf className="w-7 h-7" /> BlissFruitz
          </div>
          <p className="text-gray-500 text-sm">Sign in to your account</p>
        </div>

        <GoogleSignInSection nextPath={nextAfterLogin} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300 pr-10"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold transition-colors"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-green-600 hover:underline font-medium">
            Create Account
          </Link>
        </div>

        <div className="mt-4 bg-gray-50 rounded-xl p-3 text-center text-xs text-gray-400">
          <p className="font-medium text-gray-600 mb-1">Seeded store admin (after <span className="font-mono">npm run db:setup</span>)</p>
          <p>
            <span className="font-mono text-gray-600">admin@blissfruits.local</span>
            {" / "}
            <span className="font-mono text-gray-600">Admin123!</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center text-gray-500 text-sm">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
