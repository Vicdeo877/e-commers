import { jsonOk } from "@/lib/server/http";
import { prisma } from "@/lib/prisma";
import { normalizeHexColor } from "@/lib/theme";
import { normalizeFacebookPixelId, normalizeGoogleAnalyticsId } from "@/lib/analytics";
import { getMaintenanceMode, getCouponDefaults } from "@/lib/server/settings";

/** Public storefront config (no secrets) */
export async function GET() {
  const [g, p, s, ui, an, couponDef, inv] = await Promise.all([
    prisma.settingsGeneral.findUnique({ where: { id: 1 } }).catch(() => null),
    prisma.settingsPayment.findUnique({ where: { id: 1 } }).catch(() => null),
    prisma.settingsShipping.findUnique({ where: { id: 1 } }).catch(() => null),
    prisma.settingsUiTheme.findUnique({ where: { id: 1 } }).catch(() => null),
    prisma.settingsAnalytics.findUnique({ where: { id: 1 } }).catch(() => null),
    getCouponDefaults().catch(() => null),
    prisma.settingsInvoiceTax.findUnique({ where: { id: 1 } }).catch(() => null),
  ]);

  const gaId = normalizeGoogleAnalyticsId(an?.googleAnalyticsId ?? "");
  const fbId = normalizeFacebookPixelId(an?.facebookPixelId ?? "");
  const maint = await getMaintenanceMode();

  return jsonOk({
    site_name: g?.siteName ?? "BlissFruitz",
    logo: g?.logo ?? null,
    favicon: g?.favicon ?? null,
    contact_email: g?.email ?? null,
    contact_phone: g?.phone ?? null,
    address: g?.address ?? null,
    timezone: g?.timezone ?? "Asia/Kolkata",
    language: g?.language ?? "en",
    payment: {
      currency: p?.currency ?? "INR",
      cod_enabled: p?.codEnabled ?? true,
      razorpay_enabled: p?.razorpayEnabled ?? true,
      stripe_enabled: p?.stripeEnabled ?? false,
      paypal_enabled: p?.paypalEnabled ?? false,
    },
    shipping: {
      flat_rate: s?.flatRate ?? 50,
      free_shipping_min: s?.freeShippingMin ?? 500,
      delivery_eta_note: s?.deliveryEtaNote ?? "Express: ~20 min – 2 hrs where available",
    },
    theme: {
      theme_mode: ui?.themeMode ?? "light",
      primary_color: normalizeHexColor(ui?.primaryColor ?? "#16a34a"),
      layout_preset: ui?.layoutPreset ?? "default",
      custom_css: ui?.customCss ?? "",
      custom_js: ui?.customJs ?? "",
    },
    analytics: {
      google_analytics_id: gaId ?? "",
      facebook_pixel_id: fbId ?? "",
      conversion_track_purchase: an?.conversionTrackPurchase ?? true,
      conversion_track_add_to_cart: an?.conversionTrackAddToCart ?? true,
      conversion_track_begin_checkout: an?.conversionTrackBeginCheckout ?? true,
    },
    maintenance: {
      enabled: maint.enabled,
      message: maint.message,
    },
    coupon: {
      apply_mode: (couponDef?.couponApplyMode ?? "code_only") as "auto" | "select" | "code_only",
      auto_apply_min_order: couponDef?.autoApplyMinOrder ?? null,
    },
    invoice: {
      tax_scheme: inv?.taxScheme ?? "gst",
      tax_label: inv?.taxLabel ?? "GST",
      prices_tax_inclusive: inv?.pricesTaxInclusive ?? false,
      pdf_company_name: inv?.pdfCompanyName ?? null,
      pdf_logo_url: inv?.pdfLogoUrl ?? null,
      invoice_template: inv?.invoiceTemplate ?? "classic",
    },
  });
}
