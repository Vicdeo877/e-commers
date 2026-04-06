"use client";

import { useEffect, useState } from "react";
import { adminGetReviews, adminApproveReview, adminDeleteReview } from "@/lib/api";
import { Star, CheckCircle2, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Review {
  id: number; product_id: number; product_name?: string; product_slug?: string;
  rating: number; title?: string; comment?: string; is_approved: number;
  guest_name?: string; user_name?: string; created_at: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const load = () => {
    setLoading(true);
    adminGetReviews(page)
      .then((d) => { setReviews(d.reviews ?? []); setTotal(d.pagination?.total ?? 0); })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [page]);

  const approve = async (id: number) => {
    try { await adminApproveReview(id); toast.success("Review approved"); load(); }
    catch { toast.error("Failed"); }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this review?")) return;
    try { await adminDeleteReview(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  const filtered = filter === "pending" ? reviews.filter((r) => !r.is_approved)
    : filter === "approved" ? reviews.filter((r) => r.is_approved)
    : reviews;

  const pending = reviews.filter((r) => !r.is_approved).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} reviews total · <span className="text-primary font-bold">{pending} pending</span> approval</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-3 mb-6">
        {(["all", "pending", "approved"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm ${filter === f ? "bg-primary text-white shadow-primary/20" : "bg-card border border-card text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
            {f}
            {f === "pending" && pending > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] rounded-full px-2 py-0.5 animate-pulse shadow-lg shadow-red-500/30">{pending}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="bg-card rounded-2xl h-24 animate-pulse border border-card" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-card shadow-sm p-16 text-center">
          <Star className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-700 opacity-50" />
          <p className="text-gray-400 italic">No reviews {filter !== "all" ? `found in "${filter}"` : "available yet"}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <div key={r.id} className={`bg-card rounded-2xl border shadow-sm p-6 transition-all hover:shadow-md ${!r.is_approved ? "border-amber-500/30 dark:border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10" : "border-card"}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Stars */}
                  <div className="flex items-center gap-1.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-gray-800"}`} />
                    ))}
                    <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">{r.rating}/5 RATING</span>
                  </div>
                  {/* Author + product */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span className="font-bold text-foreground">{r.guest_name ?? r.user_name ?? "Anonymous Shopper"}</span>
                    <span className="opacity-40">·</span>
                    {r.product_slug ? (
                      <Link href={`/product/${r.product_slug}`} target="_blank"
                        className="text-primary hover:text-primary-hover font-bold flex items-center gap-1 transition-colors">
                        {r.product_name} <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : <span className="font-bold">{r.product_name}</span>}
                    <span className="opacity-40">·</span>
                    <span className="text-[10px] font-medium italic">{new Date(r.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                  {r.title && <p className="font-bold text-foreground text-sm mb-1">{r.title}</p>}
                  {r.comment && <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">{r.comment}</p>}
                </div>
                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {!r.is_approved && (
                    <button onClick={() => approve(r.id)}
                      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-primary/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                  {r.is_approved && (
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </span>
                  )}
                  <button onClick={() => remove(r.id)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-2 rounded-xl transition-all">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {Math.ceil(total / 25) > 1 && (
        <div className="flex justify-center gap-3 mt-8">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-card rounded-xl hover:bg-card disabled:opacity-20 transition-all">Prev</button>
          <span className="px-4 py-2 text-xs font-bold text-primary bg-primary/10 rounded-xl">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={reviews.length < 25}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-card rounded-xl hover:bg-card disabled:opacity-20 transition-all">Next</button>
        </div>
      )}
    </div>
  );
}
