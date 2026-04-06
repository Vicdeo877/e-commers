"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice, imgUrl } from "@/lib/utils";
import AppImage from "@/components/AppImage";
import api, { getEligibleCoupons, type EligibleCouponPreview } from "@/lib/api";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import toast from "react-hot-toast";

function normalizeApplyMode(
  raw: string | undefined
): "auto" | "select" | "code_only" {
  const m = String(raw ?? "").toLowerCase();
  if (m === "auto" || m === "select") return m;
  return "code_only";
}

export default function CartPage() {
  const { items, total, update, remove, loading } = useCart();
  const { settings } = useSiteSettings();
  const applyMode = normalizeApplyMode(settings?.coupon?.apply_mode);

  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [eligibleCoupons, setEligibleCoupons] = useState<EligibleCouponPreview[]>([]);
  const [selectValue, setSelectValue] = useState("");
  const [shippingFlat, setShippingFlat] = useState(50);
  const [freeShippingMin, setFreeShippingMin] = useState(500);
  const [deliveryEtaNote, setDeliveryEtaNote] = useState(
    "Express delivery where available: ~20 min – 2 hrs"
  );

  useEffect(() => {
    if (!settings?.shipping) return;
    setShippingFlat(Number(settings.shipping.flat_rate) || 50);
    setFreeShippingMin(Number(settings.shipping.free_shipping_min) || 500);
    if (typeof settings.shipping.delivery_eta_note === "string" && settings.shipping.delivery_eta_note.trim()) {
      setDeliveryEtaNote(settings.shipping.delivery_eta_note.trim());
    }
  }, [settings]);

  const cartSignature = useMemo(
    () => items.map((i) => `${i.product_id}:${i.quantity}`).join("|"),
    [items]
  );

  const applyCouponWithCode = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) {
        setDiscount(0);
        setCouponApplied("");
        return;
      }
      setApplyingCoupon(true);
      try {
        const res = await api.post("/checkout/initiate", {
          coupon_code: trimmed,
          dry_run: true,
          items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        });
        const discountAmt = res.data?.data?.discount_amount ?? 0;
        const resolved = res.data?.data?.coupon_code ?? trimmed;
        setDiscount(discountAmt);
        setCouponApplied(String(resolved));
        setCoupon(String(resolved).toUpperCase());
        toast.success(`Coupon applied! You save ${formatPrice(discountAmt)}`);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg ?? "Invalid or expired coupon code");
      } finally {
        setApplyingCoupon(false);
      }
    },
    [items]
  );

  /* Auto-apply: server picks best coupon when mode is `auto`. */
  useEffect(() => {
    if (applyMode !== "auto") return;
    if (!items.length || loading) return;
    let cancelled = false;
    setApplyingCoupon(true);
    void api
      .post("/checkout/initiate", {
        dry_run: true,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      })
      .then((res) => {
        if (cancelled) return;
        const discountAmt = res.data?.data?.discount_amount ?? 0;
        const resolved = res.data?.data?.coupon_code;
        setDiscount(discountAmt);
        if (resolved) {
          setCouponApplied(String(resolved));
          setCoupon(String(resolved).toUpperCase());
        } else {
          setCouponApplied("");
          setCoupon("");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setDiscount(0);
        setCouponApplied("");
        setCoupon("");
      })
      .finally(() => {
        if (!cancelled) setApplyingCoupon(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyMode, cartSignature, loading]);

  /* Select mode: load eligible coupons for dropdown. */
  useEffect(() => {
    if (applyMode !== "select") {
      setEligibleCoupons([]);
      setSelectValue("");
      return;
    }
    if (!items.length || loading) return;
    let cancelled = false;
    void getEligibleCoupons()
      .then((data) => {
        if (cancelled) return;
        setEligibleCoupons(data.coupons);
      })
      .catch(() => {
        if (!cancelled) setEligibleCoupons([]);
      });
    return () => {
      cancelled = true;
    };
  }, [applyMode, cartSignature, loading, items.length]);

  useEffect(() => {
    if (applyMode === "select" && couponApplied) {
      setSelectValue(couponApplied);
    }
  }, [applyMode, couponApplied]);

  const applyCoupon = async () => {
    await applyCouponWithCode(coupon);
  };

  const onSelectCoupon = async (code: string) => {
    setSelectValue(code);
    if (!code.trim()) {
      setDiscount(0);
      setCouponApplied("");
      return;
    }
    await applyCouponWithCode(code);
  };

  const afterDiscount = Math.max(0, total - discount);
  const shippingAmount = afterDiscount >= freeShippingMin ? 0 : shippingFlat;
  const orderTotal = afterDiscount + shippingAmount;

  const checkoutHref = couponApplied
    ? `/checkout?coupon=${encodeURIComponent(couponApplied)}`
    : "/checkout";

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some fresh fruits to get started.</p>
        <Link
          href="/shop"
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold inline-flex items-center gap-2 transition-colors"
        >
          Browse Shop <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Cart</h1>
      <div className="grid lg:grid-cols-3 gap-10">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-4 items-center">
                {/* Image */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 relative bg-gray-50 border border-gray-50">
                  {item.image_main ? (
                    <AppImage
                      src={imgUrl(item.image_main)}
                      alt={item.name}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                      placeholderName={item.name}
                      placeholderType="product"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-300 to-emerald-500 flex items-center justify-center text-white font-bold text-2xl">
                      {item.name?.[0]?.toUpperCase() ?? "F"}
                    </div>
                  )}
                </div>

                {/* Details Wrapper */}
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-base sm:text-lg line-clamp-1">{item.name}</p>
                    <p className="text-green-600 font-semibold text-sm sm:text-base">{formatPrice(item.price)}</p>
                  </div>

                  {/* Desktop Price Total */}
                  <div className="hidden sm:block text-right min-w-[100px]">
                    <p className="text-sm text-gray-400 mb-1">Total</p>
                    <p className="font-bold text-gray-900 text-lg">{formatPrice(Number(item.price) * item.quantity)}</p>
                  </div>
                </div>

                {/* Mobile Trash */}
                <button
                  type="button"
                  aria-label={`Remove ${item.name} from cart`}
                  onClick={() => remove(item.product_id)}
                  disabled={loading}
                  className="sm:hidden text-red-400 hover:text-red-600 disabled:opacity-40 p-2 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Bottom Row (Actions) */}
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between sm:justify-end gap-6">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1 px-2 border border-gray-100">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => update(item.product_id, item.quantity - 1)}
                    disabled={loading || item.quantity <= 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-bold text-gray-800 text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => update(item.product_id, item.quantity + 1)}
                    disabled={loading}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="sm:hidden text-right">
                    <p className="font-bold text-gray-900">{formatPrice(Number(item.price) * item.quantity)}</p>
                  </div>
                  
                  {/* Desktop Trash */}
                  <button
                    type="button"
                    aria-label={`Remove ${item.name} from cart`}
                    onClick={() => remove(item.product_id)}
                    disabled={loading}
                    className="hidden sm:flex text-red-400 hover:text-red-600 disabled:opacity-40 p-2 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-20">
            <h2 className="font-bold text-gray-800 text-lg mb-4">Order Summary</h2>

            {/* Coupon */}
            <div className="mb-4 space-y-3">
              {applyMode === "auto" && (
                <p className="text-xs text-gray-600 rounded-xl border border-green-100 bg-green-50/80 px-3 py-2">
                  Best eligible discount is applied automatically from your cart total
                  {settings?.coupon?.auto_apply_min_order != null &&
                  Number(settings.coupon.auto_apply_min_order) > 0
                    ? ` (min. subtotal ₹${settings.coupon.auto_apply_min_order} for auto-apply)`
                    : ""}
                  .
                </p>
              )}

              {applyMode === "select" && (
                <div className="space-y-1">
                  <label htmlFor="cart-coupon-select" className="text-xs font-medium text-gray-600">
                    Apply a coupon
                  </label>
                  <select
                    id="cart-coupon-select"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white"
                    value={selectValue || couponApplied}
                    disabled={applyingCoupon}
                    onChange={(e) => void onSelectCoupon(e.target.value)}
                  >
                    <option value="">Choose a coupon…</option>
                    {eligibleCoupons.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                        {c.description ? ` — ${c.description}` : ""} (save {formatPrice(c.discount_amount)})
                      </option>
                    ))}
                  </select>
                  {eligibleCoupons.length === 0 && !loading && (
                    <p className="text-xs text-amber-700">No coupons match this cart right now.</p>
                  )}
                </div>
              )}

              {applyMode === "code_only" && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-100 transition-all">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      id="cart-coupon"
                      autoComplete="off"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      className="flex-1 text-sm outline-none bg-transparent"
                      disabled={!!couponApplied}
                      aria-label="Coupon code"
                    />
                  </div>
                  {couponApplied ? (
                    <button
                      type="button"
                      onClick={() => { setCouponApplied(""); setDiscount(0); setCoupon(""); }}
                      className="w-full text-sm font-semibold text-red-500 hover:text-red-600 px-4 py-2.5 bg-red-50 rounded-xl transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void applyCoupon()}
                      disabled={applyingCoupon || !coupon.trim()}
                      className="w-full bg-green-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-60 transition-all premium-shadow"
                    >
                      Apply
                    </button>
                  )}
                </div>
              )}

              {applyMode === "auto" && couponApplied && discount > 0 && (
                <p className="text-xs text-green-600">✓ {couponApplied} applied automatically</p>
              )}
              {applyMode === "select" && couponApplied && (
                <p className="text-xs text-green-600">✓ {couponApplied} applied</p>
              )}
              {applyMode === "code_only" && couponApplied && (
                <p className="text-xs text-green-600">✓ {couponApplied} applied</p>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600 border-t pt-4">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(discount)}</span></div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className={shippingAmount === 0 ? "text-green-600 font-medium" : ""}>
                  {shippingAmount === 0 ? "FREE" : formatPrice(shippingAmount)}
                </span>
              </div>
              {afterDiscount < freeShippingMin && (
                <p className="text-xs text-amber-600">
                  Add {formatPrice(freeShippingMin - afterDiscount)} more for free shipping
                </p>
              )}
              <p className="text-xs text-gray-500 pt-1">{deliveryEtaNote}</p>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t">
                <span>Estimated total</span><span>{formatPrice(orderTotal)}</span>
              </div>
            </div>

            <Link
              href={checkoutHref}
              className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-3 rounded-xl font-bold mt-5 transition-colors"
            >
              Proceed to Checkout
            </Link>
            <Link href="/shop" className="block text-center text-sm text-gray-500 hover:text-green-600 mt-3">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
