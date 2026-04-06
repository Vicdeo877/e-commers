import axios from "axios";

/** Server-side fetches need an absolute URL; browser must use same origin so `bf_session` / `bf_cart` cookies match the page. */
function serverApiBase(): string {
  const root = process.env.NEXT_INTERNAL_API_URL || "http://localhost:3000";
  return `${root.replace(/\/$/, "")}/api`;
}

const BACKEND = typeof window === "undefined" ? serverApiBase() : "/api";

const api = axios.create({
  baseURL: BACKEND,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  /** Avoid infinite pending requests (blank “loading” UI if the server never responds). */
  timeout: 25_000,
});

export default api;

// ─── Catalog ──────────────────────────────────────────────────────────────────
// Response shape: { success, data: { products: [...] } }
export const getProducts = (params?: Record<string, string>) =>
  api.get("/catalog/products", { params }).then((r) => r.data?.data?.products ?? []);

// Response shape: { success, data: { product: {...} } }
export const getProduct = (slugOrId: string) =>
  api.get(`/catalog/product/${slugOrId}`).then((r) => r.data?.data?.product ?? null);

// Response shape: { success, data: { categories: [...] } }
export const getCategories = () =>
  api.get("/catalog/categories").then((r) => r.data?.data?.categories ?? []);

export const searchSuggest = (q: string) =>
  api.get("/catalog/search_suggest", { params: { q } }).then((r) => r.data?.data?.suggestions ?? []);

// ─── Content ──────────────────────────────────────────────────────────────────
// Response shape: { success, data: { banners: [...] } }  (placement=home_top by default)
export const getBanners = (placement = "hero") =>
  api.get("/content/banners", { params: { placement } }).then((r) => r.data?.data?.banners ?? []);

// Response shape: { success, data: { offers: [...] } }
export const getOffers = () =>
  api.get("/content/offers").then((r) => r.data?.data?.offers ?? []);

// Response shape: { success, data: { posts: [...] } }
export const getBlogPosts = () =>
  api.get("/content/blog").then((r) => r.data?.data?.posts ?? []);

// Response shape: { success, data: { post: {...} } }
export const getBlogPost = (slug: string) =>
  api.get(`/content/blog/${slug}`).then((r) => r.data?.data?.post ?? null);

export const getSiteSettings = () =>
  api.get("/content/site-settings").then((r) => r.data?.data ?? null);

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const getCart = () =>
  api.get("/cart").then((r) => r.data?.data?.items ?? []);

export const addToCart = (product_id: number, quantity: number) =>
  api.post("/cart/add", { product_id, quantity }).then((r) => r.data);

export const updateCart = (product_id: number, quantity: number) =>
  api.post("/cart/update", { product_id, quantity }).then((r) => r.data);

export const removeFromCart = (product_id: number) =>
  api.post("/cart/remove", { product_id }).then((r) => r.data);

export type EligibleCouponPreview = {
  code: string;
  description: string | null;
  discount_amount: number;
  audience_segment?: string;
};

/** Eligible coupons for the current server cart (when admin mode is “select”). */
export const getEligibleCoupons = () =>
  api.get("/cart/eligible-coupons").then((r) => {
    const d = r.data?.data;
    return {
      coupons: (d?.coupons ?? []) as EligibleCouponPreview[],
      subtotal: Number(d?.subtotal ?? 0),
      apply_mode: String(d?.apply_mode ?? "code_only") as "auto" | "select" | "code_only",
    };
  });

/** Rule-based best coupon for current cart + user (see GET /api/offers/recommend). */
export const getOfferRecommendations = () =>
  api.get("/offers/recommend").then((r) => r.data?.data ?? null);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password }).then((r) => r.data);

export const register = (data: {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  phone?: string;
  address?: string;
}) => api.post("/auth/register", data).then((r) => r.data);

export const logout = () =>
  api.post("/auth/logout").then((r) => r.data);

// ─── Customer ─────────────────────────────────────────────────────────────────
// Response shape: { success, data: { user: {...}, stats: {...}, profile: {...} } }
export const getProfile = (opts?: { signal?: AbortSignal }) =>
  api.get("/customer/profile", { signal: opts?.signal }).then((r) => {
    const d = r.data?.data;
    if (!d?.user) return null;
    // Merge session role into user object (DB query omits role)
    return {
      ...d.user,
      role: d.user.role ?? "customer",
      has_password: d.profile?.has_password ?? true,
    };
  });

export const updateProfile = (data: object) =>
  api.post("/customer/profile_update", data).then((r) => r.data);

// Response: { success, data: [...] }  (array returned directly)
export const getAddresses = () =>
  api.get("/customer/addresses").then((r) => Array.isArray(r.data?.data) ? r.data.data : []);

export const saveAddress = (data: object) =>
  api.post("/customer/address_save", data).then((r) => r.data);

export const getOrdersHistory = () =>
  api.get("/customer/orders_history").then((r) => r.data?.data?.orders ?? []);

export const getOrderById = (id: number) =>
  api.get(`/customer/order/${id}`).then((r) => r.data?.data?.order ?? null);

export const changePassword = (data: {
  current_password?: string;
  new_password: string;
}) => api.post("/customer/password_change", data).then((r) => r.data);

// ─── Checkout ─────────────────────────────────────────────────────────────────
export const initiateCheckout = (data: object) =>
  api.post("/checkout/initiate", data).then((r) => r.data);

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const getReviews = (product_id: number) =>
  api.get("/reviews", { params: { product_id } }).then((r) => r.data?.data?.reviews ?? []);

export const submitReview = (data: object) =>
  api.post("/reviews", data).then((r) => r.data);

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminGetStats = () =>
  api.get("/admin/stats").then((r) => r.data?.data ?? null);

export const adminGetSettings = () =>
  api.get("/admin/settings").then((r) => r.data?.data ?? null);

export const adminGetMessages = (page = 1) =>
  api.get("/admin/messages", { params: { page: String(page) } }).then((r) => r.data?.data ?? { messages: [], pagination: {} });

export const adminMarkMessageRead = (id: number) =>
  api.post("/admin/message_read", { id }).then((r) => r.data);

export const adminUpdateSettings = (data: {
  general?: Record<string, unknown>;
  payment?: Record<string, unknown>;
  shipping?: Record<string, unknown>;
  product_catalog?: Record<string, unknown>;
  backup?: Record<string, unknown>;
  maintenance?: Record<string, unknown>;
  api_integrations?: Record<string, unknown>;
  coupon_defaults?: Record<string, unknown>;
  invoice_tax?: Record<string, unknown>;
  ui_theme?: Record<string, unknown>;
  email_notifications?: Record<string, unknown>;
  security?: Record<string, unknown>;
  analytics?: Record<string, unknown>;
}) => api.put("/admin/settings", data).then((r) => r.data);

/** Download SQLite DB (admin). Only for file: DATABASE_URL. */
export const adminExportDatabase = () =>
  api.get("/admin/backup/export", { responseType: "blob" }).then((res) => {
    const cd = res.headers["content-disposition"] as string | undefined;
    let filename = "backup.db";
    if (cd?.includes("filename=")) {
      const m = cd.match(/filename="([^"]+)"|filename=([^;]+)/);
      if (m) filename = (m[1] || m[2]).trim();
    }
    return { blob: res.data as Blob, filename };
  });

export const adminRestoreDatabase = (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/admin/backup/restore", fd).then((r) => r.data);
};

/** Removes `.next`. Blocked in production unless ALLOW_ADMIN_CACHE_CLEAR=true */
export const adminClearNextCache = () =>
  api.post("/admin/system/clear-cache").then((r) => r.data);

export const adminCreateProduct = (data: object) =>
  api.post("/admin/product_create", data).then((r) => r.data);

export const adminUpdateProduct = (data: object) =>
  api.post("/admin/product_update", data).then((r) => r.data);

export const adminDeleteProduct = (product_id: number) =>
  api.post("/admin/product_delete", { product_id }).then((r) => r.data);

export const adminUpdateOrderStatus = (order_id: number, order_status: string, tracking_number?: string, payment_status?: string) =>
  api.post("/admin/order_update_status", { id: order_id, order_status, tracking_number, payment_status }).then((r) => r.data);

export const adminCreateCoupon = (data: object) =>
  api.post("/admin/coupon_create", data).then((r) => r.data);

// ─── Admin orders ─────────────────────────────────────────────────────────────
export const adminGetOrders = (params?: Record<string, string>) =>
  api.get("/admin/orders", { params }).then((r) => r.data?.data ?? { orders: [], pagination: {} });

export const adminGetOrder = (id: number) =>
  api.get(`/admin/order/${id}`).then((r) => r.data?.data?.order ?? null);

export const adminGetCustomers = (params?: Record<string, string>) =>
  api.get("/admin/customers", { params }).then((r) => r.data?.data ?? { customers: [], pagination: {} });

export const adminGetCustomer = (id: number) =>
  api.get(`/admin/customer/${id}`).then((r) => r.data?.data?.customer ?? null);

export const adminUpdateCustomerStatus = (id: number, is_active: boolean) =>
  api.post("/admin/customer_update_status", { id, is_active }).then((r) => r.data);

export const adminGetAdmins = () =>
  api.get("/admin/admins").then((r) => r.data?.data ?? { admins: [] });

export const adminCreateAdminUser = (data: {
  email: string;
  username: string;
  full_name: string;
  password: string;
  confirm_password: string;
  phone?: string;
}) => api.post("/admin/admin_create", data).then((r) => r.data);

export const adminGetCoupons = () =>
  api.get("/admin/coupons").then((r) => r.data?.data?.coupons ?? []);

export const adminUpdateCoupon = (id: number, data: object) =>
  api.patch(`/admin/coupons/${id}`, data).then((r) => r.data);

export const adminDeleteCoupon = (id: number) =>
  api.delete(`/admin/coupons/${id}`).then((r) => r.data);

export const adminGetReviews = (page = 1) =>
  api.get("/admin/reviews", { params: { page: String(page) } }).then((r) => r.data?.data ?? { reviews: [], pagination: {} });

export const adminApproveReview = (id: number) =>
  api.post("/admin/review_approve", { id }).then((r) => r.data);

export const adminDeleteReview = (id: number) =>
  api.post("/admin/review_delete", { id }).then((r) => r.data);

// ─── Banner admin ─────────────────────────────────────────────────────────────
export const adminGetAllBanners = () =>
  api.get("/content/banners", { params: { placement: "all" } }).then((r) => r.data?.data?.banners ?? []);

export const adminCreateBanner = (data: object) =>
  api.post("/admin/banner_create", data).then((r) => r.data);

export const adminUpdateBanner = (data: object) =>
  api.post("/admin/banner_update", data).then((r) => r.data);

export const adminDeleteBanner = (id: number) =>
  api.post("/admin/banner_delete", { id }).then((r) => r.data);

/** Homepage “Offers & deals” strip — all rows including inactive (admin). */
export const adminGetOffersAdmin = () =>
  api.get("/admin/offers").then((r) => r.data?.data?.offers ?? []);

export const adminCreateOffer = (data: object) =>
  api.post("/admin/offers", data).then((r) => r.data);

export const adminUpdateOffer = (id: number, data: object) =>
  api.patch(`/admin/offers/${id}`, data).then((r) => r.data);

export const adminDeleteOffer = (id: number) =>
  api.delete(`/admin/offers/${id}`).then((r) => r.data);

// ─── Blog admin ───────────────────────────────────────────────────────────────
export const adminGetBlogs = () =>
  api.get("/admin/blogs").then((r) => r.data?.data?.posts ?? []);

export const adminCreateBlog = (data: object) =>
  api.post("/admin/blog_create", data).then((r) => r.data);

export const adminUpdateBlog = (data: object) =>
  api.post("/admin/blog_update", data).then((r) => r.data);

export const adminDeleteBlog = (id: number) =>
  api.post("/admin/blog_delete", { id }).then((r) => r.data);

// ─── Image Upload ─────────────────────────────────────────────────────────────
export async function uploadImage(
  file: File,
  folder: "product" | "banner" | "blog" | "category" | "branding"
): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  const uploadUrl =
    typeof window === "undefined" ? `${serverApiBase()}/upload/${folder}` : `/api/upload/${folder}`;
  const res = await fetch(uploadUrl, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Upload failed");
  }
  const json = await res.json();
  return json?.data?.url ?? "";
}
