"use client";

import { useEffect, useState } from "react";
import { adminGetBlogs, adminCreateBlog, adminUpdateBlog, adminDeleteBlog } from "@/lib/api";
import { Plus, Pencil, Trash2, X, FileText, ExternalLink } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import Link from "next/link";
import toast from "react-hot-toast";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  cover_image?: string;
  is_published: boolean;
  published_at?: string;
}
interface BlogForm {
  title: string; excerpt: string; content: string;
  cover_image: string; is_published: boolean;
}

const empty: BlogForm = { title: "", excerpt: "", content: "", cover_image: "", is_published: true };

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState<BlogForm>(empty);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetBlogs()
      .then((d) => setPosts(Array.isArray(d) ? d : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setShowModal(true); };
  const openEdit = (p: Post) => {
    setEditing(p);
    setForm({
      title: p.title,
      excerpt: p.excerpt ?? "",
      content: p.content ?? "",
      cover_image: p.cover_image ?? "",
      is_published: p.is_published !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminUpdateBlog({ ...form, id: editing.id });
        toast.success("Post updated!");
      } else {
        await adminCreateBlog(form);
        toast.success("Post created!");
      }
      load(); setShowModal(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try { await adminDeleteBlog(id); toast.success("Post deleted"); load(); }
    catch { toast.error("Failed to delete"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{posts.length} posts</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border" />)}</div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-25" />
          <p className="font-medium mb-1">No blog posts yet</p>
          <p className="text-sm">Click "New Post" to write your first article.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Title", "Published", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 line-clamp-1">{p.title}</p>
                    {p.excerpt && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{p.excerpt}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {p.published_at ? new Date(p.published_at).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {p.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <Link href={`/blog/${p.slug}`} target="_blank" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="View on site">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(p.id, p.title)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900 text-lg">{editing ? "Edit Post" : "New Blog Post"}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Cover image */}
              <ImageUpload
                folder="blog"
                value={form.cover_image}
                onChange={(url) => setForm((f) => ({ ...f, cover_image: url }))}
                label="Cover Image"
              />

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Post Title *</label>
                <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Nature's Sweet Treats"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Excerpt (shown in preview cards)</label>
                <textarea rows={2} value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  placeholder="Short summary of the post..."
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300 resize-none" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Content (HTML supported)</label>
                <textarea rows={8} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="<p>Write your full post content here. You can use basic HTML tags for formatting.</p>"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300 resize-none font-mono" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))} className="rounded" />
                <span className="text-gray-700">Publish immediately (visible to customers)</span>
              </label>

              <div className="flex gap-3 pt-2 border-t">
                <button type="submit" disabled={saving}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  {saving ? "Saving…" : editing ? "Update Post" : "Publish Post"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 text-sm px-4">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
