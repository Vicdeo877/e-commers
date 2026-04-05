"use client";

import { useEffect, useState } from "react";
import { getProducts, getCategories, adminCreateProduct, adminUpdateProduct, adminDeleteProduct } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import { imgUrl } from "@/lib/utils";
import toast from "react-hot-toast";
import AppImage from "@/components/AppImage";

interface Product {
  id: number; name: string; slug: string; price: number; stock_quantity: number;
  is_active: number; image_main?: string; category_id?: number; unit?: string;
  description?: string; compare_price?: number; sku?: string;
}
interface Category { id: number; name: string; }
interface ProductForm {
  name: string; slug: string; price: string; compare_price: string;
  stock_quantity: string; unit: string; sku: string; category_id: string;
  description: string; short_description: string; is_active: boolean;
  is_featured: boolean; image_main: string;
}

const empty: ProductForm = {
  name: "", slug: "", price: "", compare_price: "", stock_quantity: "",
  unit: "kg", sku: "", category_id: "", description: "", short_description: "",
  is_active: true, is_featured: false, image_main: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(empty);
  const [loading, setLoading] = useState(false);

  const load = () => {
    getProducts().then((d) => setProducts(Array.isArray(d) ? d : [])).catch(() => {});
    getCategories().then((d) => setCategories(Array.isArray(d) ? d : [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, price: String(p.price),
      compare_price: String(p.compare_price ?? ""),
      stock_quantity: String(p.stock_quantity), unit: p.unit ?? "kg",
      sku: p.sku ?? "", category_id: String(p.category_id ?? ""),
      description: p.description ?? "", short_description: "",
      is_active: !!p.is_active, is_featured: false,
      image_main: p.image_main ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...form,
        price: parseFloat(form.price),
        stock_quantity: parseInt(form.stock_quantity),
        compare_price: form.compare_price ? parseFloat(form.compare_price) : undefined,
        category_id: form.category_id ? parseInt(form.category_id) : undefined,
      };
      if (editing) {
        await adminUpdateProduct({ ...data, id: editing.id });
        toast.success("Product updated!");
      } else {
        const res = (await adminCreateProduct(data)) as {
          data?: { product?: { sku?: string | null } };
        };
        const assignedSku = res?.data?.product?.sku;
        toast.success(
          assignedSku ? `Product created (SKU ${assignedSku})` : "Product created!"
        );
      }
      load();
      setShowModal(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await adminDeleteProduct(id);
      toast.success("Product deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const fields = [
    { name: "name", label: "Product Name *", required: true, colSpan: 2 },
    { name: "price", label: "Price (â‚¹) *", type: "number", required: true },
    { name: "compare_price", label: "Compare Price (â‚¹)", type: "number" },
    { name: "stock_quantity", label: "Stock *", type: "number", required: true },
    { name: "sku", label: "SKU" },
    { name: "unit", label: "Unit (kg / pc / 250g)" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} products</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Product", "Price", "Stock", "Category", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No products yet. Click "Add Product" to get started.</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                        <AppImage
                          src={p.image_main ? imgUrl(p.image_main) : null}
                          alt={p.name}
                          width={40} height={40}
                          className="w-10 h-10"
                          placeholderName={p.name}
                          placeholderType="product"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-green-600">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.stock_quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.stock_quantity} {p.unit ?? "kg"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{categories.find((c) => c.id === p.category_id)?.name ?? "â€”"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* â”€â”€ Modal â”€â”€ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900 text-lg">{editing ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Image upload */}
              <ImageUpload
                folder="product"
                value={form.image_main}
                onChange={(url) => setForm((f) => ({ ...f, image_main: url }))}
                label="Product Image"
              />

              <div className="grid sm:grid-cols-2 gap-4">
                {fields.map((f) => (
                  <div key={f.name} className={f.colSpan === 2 ? "sm:col-span-2" : ""}>
                    <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                    <input
                      type={f.type ?? "text"}
                      required={f.required}
                      value={form[f.name as keyof ProductForm] as string}
                      onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                      className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Category</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300"
                  >
                    <option value="">No category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {!editing && (
                <p className="text-xs text-gray-400 -mt-1">
                  With <strong className="font-medium text-gray-500">Auto-generate SKU</strong> enabled in{" "}
                  <span className="font-medium">Admin → Settings → Product catalog</span>, leave SKU empty and a code
                  like BF-0001 will be assigned automatically.
                </p>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Short Description</label>
                <input
                  type="text"
                  value={form.short_description}
                  onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))}
                  placeholder="One-line summary shown on product cards"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Full Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Detailed product description..."
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300 resize-none"
                />
              </div>

              <div className="flex gap-5 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="rounded" />
                  <span className="text-gray-700">Active (visible to customers)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))} className="rounded" />
                  <span className="text-gray-700">Featured (shown on home page)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  {loading ? "Savingâ€¦" : editing ? "Update Product" : "Create Product"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-sm px-4">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

