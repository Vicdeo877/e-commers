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
          <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total · {pending} pending approval</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "pending", "approved"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${filter === f ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pending > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{pending}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
          <Star className="w-10 h-10 mx-auto mb-2 opacity-25" />
          <p>No reviews {filter !== "all" ? `in "${filter}"` : "yet"}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${!r.is_approved ? "border-amber-200 bg-amber-50/30" : "border-gray-100"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">{r.rating}/5</span>
                  </div>
                  {/* Author + product */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">{r.guest_name ?? r.user_name ?? "Anonymous"}</span>
                    <span>·</span>
                    {r.product_slug ? (
                      <Link href={`/product/${r.product_slug}`} target="_blank"
                        className="text-green-600 hover:underline flex items-center gap-0.5">
                        {r.product_name} <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    ) : <span>{r.product_name}</span>}
                    <span>·</span>
                    <span>{new Date(r.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                  {r.title && <p className="font-semibold text-gray-800 text-sm">{r.title}</p>}
                  {r.comment && <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{r.comment}</p>}
                </div>
                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {!r.is_approved && (
                    <button onClick={() => approve(r.id)}
                      className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-xl font-medium transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                  {r.is_approved && (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-xl font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </span>
                  )}
                  <button onClick={() => remove(r.id)}
                    className="flex items-center gap-1 text-xs border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-xl font-medium transition-colors">
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
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-40">Prev</button>
          <span className="px-3 py-1 text-sm text-gray-600">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={reviews.length < 25}
            className="px-3 py-1 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
