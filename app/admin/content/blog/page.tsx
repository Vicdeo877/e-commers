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
          <h1 className="text-2xl font-bold text-foreground">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{posts.length} published articles</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-primary/20 uppercase tracking-widest">
          <Plus className="w-4 h-4" /> New Blog Post
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="bg-card rounded-2xl h-20 animate-pulse border border-card" />)}</div>
      ) : posts.length === 0 ? (
        <div className="bg-card rounded-2xl border border-card shadow-sm p-16 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-300 dark:text-gray-700" />
          <p className="font-bold text-lg text-foreground mb-1">No articles found</p>
          <p className="text-sm opacity-60">Click "New Blog Post" to share your first story with customers.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-card">
              <tr>
                {["Article Title", "Publication Date", "Visibility", "Actions"].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-card">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground line-clamp-1">{p.title}</p>
                    {p.excerpt && <p className="text-xs text-gray-400 line-clamp-1 mt-1 italic">{p.excerpt}</p>}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-500">
                    {p.published_at ? new Date(p.published_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : <span className="opacity-30 italic">Not set</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border transition-all ${p.is_published ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200" : "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200"}`}>
                      {p.is_published ? "Published" : "Draft Mode"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-2.5 rounded-xl hover:bg-primary/10 text-primary transition-all border border-transparent hover:border-primary/20" title="Edit Article">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <Link href={`/blog/${p.slug}`} target="_blank" className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-foreground transition-all border border-transparent" title="View Article on Site">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(p.id, p.title)} className="p-2.5 rounded-xl hover:bg-red-500/10 text-red-500 transition-all border border-transparent hover:border-red-500/20" title="Delete Article">
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all animate-in fade-in">
          <div className="bg-card rounded-2xl shadow-2xl border border-card w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-card sticky top-0 bg-card z-10">
              <h2 className="font-bold text-foreground text-xl">{editing ? "Edit Blog Article" : "Compose New Article"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              {/* Cover image */}
              <ImageUpload
                folder="blog"
                value={form.cover_image}
                onChange={(url) => setForm((f) => ({ ...f, cover_image: url }))}
                label="Cover Image"
              />

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Article Headline *</label>
                <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Nature's Sweet Treats"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Short Excerpt (SEO Preview)</label>
                <textarea rows={2} value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  placeholder="Compelling summary of the post..."
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all resize-none italic" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Main Content (Rich Text / HTML)</label>
                <textarea rows={10} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="<p>Craft your beautiful story here content here...</p>"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-card rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all resize-none font-mono leading-relaxed" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-card transition-colors hover:border-primary/20">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))} className="w-5 h-5 rounded border-card text-primary focus:ring-primary/20 bg-card" />
                <span className="text-sm font-bold text-gray-500 hover:text-foreground">Publish Immediately <span className="text-[10px] font-normal uppercase tracking-wide opacity-40 ml-1">(live on site)</span></span>
              </label>

              <div className="flex gap-4 pt-6 border-t border-card">
                <button type="submit" disabled={saving}
                  className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
                  {saving ? "Processing…" : editing ? "Update Article" : "Publish Article"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 font-bold text-xs uppercase tracking-widest px-4 hover:text-foreground transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
