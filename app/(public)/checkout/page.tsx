"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import api, { getAddresses } from "@/lib/api";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { trackBeginCheckoutEcommerce } from "@/lib/analytics-track";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";
import { ShieldCheck, Truck, CreditCard, Banknote, CheckCircle2, Loader2 } from "lucide-react";

/* ── Razorpay window type ── */
declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open(): void };
  }
}

interface ShippingForm {
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  notes: string;
  guest_email: string;
}

interface SavedAddressRow {
  id: number;
  label?: string | null;
  full_name: string;
  phone?: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  is_default: number;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, total, refresh } = useCart();

  /* Re-sync cart from server when opening checkout (avoids stale UI vs server cookie/session) */
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const couponCode = searchParams.get("coupon") ?? "";
  const beginCheckoutFired = useRef(false);
  const [discountPreview, setDiscountPreview] = useState(0);
  const [resolvedCouponLabel, setResolvedCouponLabel] = useState<string | null>(null);

  const [form, setForm] = useState<ShippingForm>({
    shipping_name: "", shipping_phone: "", shipping_address: "",
    shipping_city: "", shipping_state: "", shipping_pincode: "",
    notes: "", guest_email: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">("cod");
  const [siteName, setSiteName] = useState("BlissFruitz");
  const [shipFlat, setShipFlat] = useState(50);
  const [freeShipMin, setFreeShipMin] = useState(500);
  const [deliveryEtaNote, setDeliveryEtaNote] = useState("");
  const [payCodEnabled, setPayCodEnabled] = useState(true);
  const [payRzpEnabled, setPayRzpEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rzpReady, setRzpReady] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressRow[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const applySavedAddress = useCallback(
    (addr: SavedAddressRow, profilePhone?: string) => {
      setForm((f) => ({
        ...f,
        shipping_name: addr.full_name,
        shipping_phone: addr.phone?.trim() || profilePhone || "",
        shipping_address: addr.line1,
        shipping_city: addr.city,
        shipping_state: addr.state,
        shipping_pincode: addr.pincode,
      }));
      setSelectedAddressId(addr.id);
    },
    []
  );

  /* Pre-fill shipping: default saved address first, else profile name/phone */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getAddresses()
      .then((rows) => {
        if (cancelled || !Array.isArray(rows)) return;
        const list = rows as SavedAddressRow[];
        setSavedAddresses(list);
        if (list.length === 0) {
          setSelectedAddressId(null);
          setForm((f) => ({
            ...f,
            shipping_name: user.full_name,
            shipping_phone: user.phone ?? "",
          }));
          return;
        }
        const chosen = list.find((a) => a.is_default === 1) ?? list[0];
        applySavedAddress(chosen, user.phone ?? "");
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedAddressId(null);
          setForm((f) => ({
            ...f,
            shipping_name: user.full_name,
            shipping_phone: user.phone ?? "",
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, applySavedAddress]);

  useEffect(() => {
    if (!settings) return;
    if (typeof settings.site_name === "string" && settings.site_name.trim()) {
      setSiteName(settings.site_name.trim());
    }
    setShipFlat(Number(settings.shipping.flat_rate) || 50);
    setFreeShipMin(Number(settings.shipping.free_shipping_min) || 500);
    if (typeof settings.shipping.delivery_eta_note === "string") {
      setDeliveryEtaNote(settings.shipping.delivery_eta_note.trim());
    }
    const cod = settings.payment.cod_enabled !== false;
    const rzp = settings.payment.razorpay_enabled !== false;
    setPayCodEnabled(cod);
    setPayRzpEnabled(rzp);
    setPaymentMethod((cur) => {
      if (cur === "cod" && !cod && rzp) return "razorpay";
      if (cur === "razorpay" && !rzp && cod) return "cod";
      return cur;
    });
  }, [settings]);

  /* Match server cart totals (discount + free-shipping threshold after discount). */
  useEffect(() => {
    if (items.length === 0) {
      setDiscountPreview(0);
      setResolvedCouponLabel(null);
      return;
    }
    let cancelled = false;
    const trimmed = couponCode.trim();
    void api
      .post("/checkout/initiate", {
        dry_run: true,
        ...(trimmed ? { coupon_code: trimmed } : {}),
      })
      .then((res) => {
        if (cancelled) return;
        setDiscountPreview(Number(res.data?.data?.discount_amount ?? 0));
        const c = res.data?.data?.coupon_code;
        setResolvedCouponLabel(c != null && String(c).trim() !== "" ? String(c) : null);
      })
      .catch(() => {
        if (!cancelled) {
          setDiscountPreview(0);
          setResolvedCouponLabel(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [items, total, couponCode]);

  useEffect(() => {
    if (!settings || items.length === 0 || beginCheckoutFired.current) return;
    beginCheckoutFired.current = true;
    const cur = settings.payment.currency ?? "INR";
    trackBeginCheckoutEcommerce({
      currency: cur,
      value: total,
      items: items.map((i) => ({
        id: i.product_id,
        name: i.name,
        quantity: i.quantity,
        price: Number(i.price),
      })),
    });
  }, [settings, items, total]);

  /* Load Razorpay SDK */
  useEffect(() => {
    if (document.getElementById("rzp-script")) { setRzpReady(true); return; }
    const script = document.createElement("script");
    script.id = "rzp-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setRzpReady(true);
    document.head.appendChild(script);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const afterDiscount = Math.max(0, total - discountPreview);
  const shippingAmount = afterDiscount >= freeShipMin ? 0 : shipFlat;
  const grandTotal = afterDiscount + shippingAmount;
  const couponLabel = resolvedCouponLabel || (couponCode.trim() || null);

  /* ── COD flow ── */
  const placeCOD = useCallback(async () => {
      const res = await api.post("/checkout/initiate", {
        ...form,
        payment_method: "cod",
        coupon_code: couponCode || undefined,
      });
      const order = res.data?.data;
      await refresh();
      router.push(`/order-success?order_id=${order.order_id}&order_number=${order.order_number}`);
  }, [form, couponCode, refresh, router]);

  /* ── Razorpay flow ── */
  const placeRazorpay = useCallback(async () => {
    const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!rzpKey) { toast.error("Razorpay not configured."); return; }
    if (!rzpReady) { toast.error("Razorpay SDK not loaded yet, please wait."); return; }

    // Step 1: create order on backend
    const res = await api.post("/checkout/initiate", {
      ...form,
      payment_method: "razorpay",
      coupon_code: couponCode || undefined,
    });
    const orderData = res.data?.data;

    // Step 2: open Razorpay checkout dialog
    await new Promise<void>((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: rzpKey,
        amount: orderData.amount,
        currency: orderData.currency ?? "INR",
        name: siteName,
        description: `Order #${orderData.order_number}`,
        order_id: orderData.razorpay_order_id,
        prefill: {
          name: form.shipping_name,
          email: form.guest_email || user?.email || "",
          contact: form.shipping_phone,
        },
        theme: { color: "#16a34a" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // Step 3: verify payment on backend
            await api.post("/checkout/verify_razorpay", {
              local_order_id: orderData.local_order_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await refresh();
            router.push(`/order-success?order_id=${orderData.local_order_id}&order_number=${orderData.order_number}`);
            resolve();
          } catch {
            router.push("/order-failed");
            reject(new Error("Payment verification failed"));
          }
        },
          modal: {
            ondismiss: () => { router.push("/order-failed"); reject(new Error("Payment cancelled")); },
          },
      });
      rzp.open();
    });
  }, [form, couponCode, rzpReady, user, refresh, router, siteName]);

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error("Your cart is empty"); return; }

    // Client-side validation
    if (!form.shipping_name.trim()) { toast.error("Please enter your full name"); return; }
    if (!form.shipping_phone.trim()) { toast.error("Please enter your phone number"); return; }
    if (!form.shipping_address.trim()) { toast.error("Please enter your address"); return; }
    if (!form.shipping_city.trim()) { toast.error("Please enter your city"); return; }
    if (!form.shipping_pincode.trim()) { toast.error("Please enter your pincode"); return; }

    if (paymentMethod === "cod" && !payCodEnabled) {
      toast.error("Cash on delivery is disabled.");
      return;
    }
    if (paymentMethod === "razorpay" && !payRzpEnabled) {
      toast.error("Online payment is disabled.");
      return;
    }

    setLoading(true);
    try {
      if (paymentMethod === "cod") {
        await placeCOD();
      } else {
        await placeRazorpay();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message;
      if (msg && msg !== "Payment cancelled") toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Checkout</h1>
      <p className="text-gray-500 text-sm mb-8">Complete your order below</p>

      {!user && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          <Link href="/login" className="underline font-semibold">Login</Link> or{" "}
          <Link href="/register" className="underline font-semibold">Create Account</Link> to track your order, or continue as guest.
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        {/* ── LEFT: Forms ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Guest email */}
          {!user && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-4">Contact Details</h2>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Email *</label>
                <input name="guest_email" type="email" required={!user} value={form.guest_email} onChange={handleChange} className={inputCls} placeholder="you@example.com" />
              </div>
            </div>
          )}

          {/* Shipping */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-green-600" /> Shipping Address
            </h2>
            {user && savedAddresses.length > 0 && (
              <div className="mb-4 space-y-1">
                {savedAddresses.length > 1 ? (
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Saved address</label>
                    <select
                      aria-label="Choose a saved shipping address"
                      className={inputCls}
                      value={selectedAddressId ?? savedAddresses[0]?.id ?? ""}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        const addr = savedAddresses.find((a) => a.id === id);
                        if (addr) applySavedAddress(addr, user.phone ?? "");
                      }}
                    >
                      {savedAddresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {(a.label ? `${a.label} · ` : "") +
                            [a.line1, a.city].filter(Boolean).join(", ")}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                    Using your saved address
                    {savedAddresses[0]?.is_default === 1 ? " (default)" : ""}.
                  </p>
                )}
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Full Name *</label>
                <input name="shipping_name" required value={form.shipping_name} onChange={handleChange} className={inputCls} placeholder="Rahul Sharma" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Phone *</label>
                <input name="shipping_phone" type="tel" required value={form.shipping_phone} onChange={handleChange} className={inputCls} placeholder="9876543210" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600 mb-1 block">Address Line *</label>
                <input name="shipping_address" required value={form.shipping_address} onChange={handleChange} className={inputCls} placeholder="House No, Street, Area" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">City *</label>
                <input name="shipping_city" required value={form.shipping_city} onChange={handleChange} className={inputCls} placeholder="Mumbai" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">State</label>
                <input name="shipping_state" value={form.shipping_state} onChange={handleChange} className={inputCls} placeholder="Maharashtra" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Pincode *</label>
                <input name="shipping_pincode" required value={form.shipping_pincode} onChange={handleChange} className={inputCls} placeholder="400001" maxLength={6} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Order Notes (optional)</label>
                <input name="notes" value={form.notes} onChange={handleChange} className={inputCls} placeholder="Delivery instructions…" />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" /> Payment Method
            </h2>
            {!payCodEnabled && !payRzpEnabled && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                No payment methods are enabled. Please contact the store.
              </p>
            )}
            <div className={`grid gap-3 ${payCodEnabled && payRzpEnabled ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
              {/* COD */}
              {payCodEnabled && (
              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === "cod" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === "cod" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">Pay when your order arrives</p>
                </div>
                {paymentMethod === "cod" && <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />}
              </button>
              )}

              {/* Razorpay */}
              {payRzpEnabled && (
              <button
                type="button"
                onClick={() => setPaymentMethod("razorpay")}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === "razorpay" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === "razorpay" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Pay Online</p>
                  <p className="text-xs text-gray-500">UPI · Cards · Net Banking via Razorpay</p>
                </div>
                {paymentMethod === "razorpay" && <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />}
              </button>
              )}
            </div>

            {paymentMethod === "razorpay" && (
              <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Secured by Razorpay. Supports UPI, Debit/Credit Cards, Net Banking and Wallets.
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Order Summary ── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-20">
            <h2 className="font-bold text-gray-800 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm text-gray-600 mb-4 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between gap-2">
                  <span className="line-clamp-1 flex-1">{item.name} × {item.quantity}</span>
                  <span className="font-medium shrink-0">{formatPrice(Number(item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>{formatPrice(total)}</span>
              </div>
              {discountPreview > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount{couponLabel ? ` (${couponLabel})` : ""}</span>
                  <span>−{formatPrice(discountPreview)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shippingAmount === 0 ? <span className="text-green-600 font-medium">FREE</span> : formatPrice(shippingAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2">
                <span>Total</span><span>{formatPrice(grandTotal)}</span>
              </div>
              {afterDiscount < freeShipMin && (
                <p className="text-xs text-amber-600">Add {formatPrice(freeShipMin - afterDiscount)} more for free shipping!</p>
              )}
              {deliveryEtaNote && (
                <p className="text-xs text-gray-500 pt-1">{deliveryEtaNote}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || items.length === 0 || (!payCodEnabled && !payRzpEnabled)}
              className={`w-full mt-5 py-3 rounded-xl font-bold text-white disabled:opacity-60 transition-colors flex items-center justify-center gap-2 ${paymentMethod === "razorpay" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
              ) : paymentMethod === "razorpay" ? (
                <><CreditCard className="w-4 h-4" /> Pay {formatPrice(grandTotal)}</>
              ) : (
                "Place Order (COD)"
              )}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Secure & encrypted checkout
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-20 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading checkout…</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
