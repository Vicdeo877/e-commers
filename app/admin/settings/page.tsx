"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Settings, Globe, CreditCard, Truck, Mail, Shield, Palette, BarChart3,
  Receipt, Ticket, Plug, Database, Package, Wrench, Loader2, Upload, Download, Eye
} from "lucide-react";
import {
  adminGetSettings,
  adminUpdateSettings,
  uploadImage,
  getCategories,
  adminExportDatabase,
  adminRestoreDatabase,
  adminClearNextCache,
} from "@/lib/api";
import { generateInvoicePDF } from "@/lib/invoice";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type SectionId =
  | "general"
  | "payment"
  | "shipping"
  | "email"
  | "security"
  | "ui"
  | "analytics"
  | "invoice"
  | "coupons"
  | "api"
  | "backup"
  | "products"
  | "maintenance";

const NAV: { id: SectionId; label: string; icon: typeof Settings }[] = [
  { id: "general", label: "General", icon: Globe },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "email", label: "Email & Notifications", icon: Mail },
  { id: "security", label: "Security", icon: Shield },
  { id: "ui", label: "UI / Theme", icon: Palette },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "invoice", label: "Invoice & Tax", icon: Receipt },
  { id: "coupons", label: "Coupons", icon: Ticket },
  { id: "api", label: "API & Integrations", icon: Plug },
  { id: "backup", label: "Backup & System", icon: Database },
  { id: "products", label: "Products", icon: Package },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
];

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "UTC",
  "Europe/London",
  "America/New_York",
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi (हिंदी)" },
];

export default function AdminSettingsPage() {
  const [section, setSection] = useState<SectionId>("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [general, setGeneral] = useState({
    site_name: "",
    logo: "",
    favicon: "",
    email: "",
    phone: "",
    address: "",
    timezone: "Asia/Kolkata",
    language: "en",
  });
  const [payment, setPayment] = useState({
    currency: "INR",
    cod_enabled: true,
    razorpay_enabled: true,
    stripe_enabled: false,
    paypal_enabled: false,
    auto_refund_enabled: false,
    razorpay_webhook_url: "",
  });
  const [shipping, setShipping] = useState({
    flat_rate: 50,
    free_shipping_min: 500,
    delivery_eta_note: "",
  });
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [productCatalog, setProductCatalog] = useState({
    default_import_category_id: null as number | null,
    sku_auto_generate: false,
    sku_prefix: "BF-",
    inventory_alerts_enabled: false,
    inventory_low_threshold: 10,
    csv_bulk_upload_enabled: false,
  });
  const [backup, setBackup] = useState({
    scheduled_local_enabled: false,
    scheduled_local_frequency: "none" as "none" | "daily" | "weekly",
    local_retention_days: 7,
    cloud_backup_enabled: false,
    cloud_provider: "none" as "none" | "s3" | "gcs" | "gdrive",
  });
  const [exportBusy, setExportBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreAck, setRestoreAck] = useState(false);
  const [clearBusy, setClearBusy] = useState(false);
  const [maintenance, setMaintenance] = useState({
    enabled: false,
    message: "We're making improvements. Please check back soon.",
  });
  const [apiIntegrations, setApiIntegrations] = useState({
    rest_api_enabled: false,
    webhook_erp_url: "",
    webhook_crm_url: "",
    shiprocket_enabled: false,
    shiprocket_webhook_url: "",
    delhivery_enabled: false,
    delhivery_webhook_url: "",
  });
  const [couponDefaults, setCouponDefaults] = useState({
    coupon_apply_mode: "code_only" as "auto" | "select" | "code_only",
    auto_apply_min_order: "",
    user_specific_codes_enabled: false,
  });
  const [invoiceTax, setInvoiceTax] = useState({
    tax_scheme: "gst" as "gst" | "vat" | "none",
    tax_label: "GST",
    default_tax_rate_percent: "",
    prices_tax_inclusive: false,
    invoice_prefix: "INV-",
    invoice_number_padding: "4",
    pdf_company_name: "",
    pdf_logo_url: "",
    per_product_tax_enabled: false,
    invoice_template: "classic",
  });
  const [uiTheme, setUiTheme] = useState({
    theme_mode: "light" as "light" | "dark" | "system",
    primary_color: "#16a34a",
    layout_preset: "default" as "default" | "compact" | "wide",
    custom_css: "",
    custom_js: "",
  });
  const [emailNotifications, setEmailNotifications] = useState({
    smtp_enabled: false,
    smtp_host: "",
    smtp_port: 587,
    smtp_tls: true,
    smtp_user: "",
    smtp_password: "",
    smtp_password_set: false,
    smtp_from_email: "",
    smtp_from_name: "",
    sms_provider: "none" as "none" | "twilio" | "fast2sms",
    twilio_account_sid: "",
    twilio_auth_token: "",
    twilio_auth_token_set: false,
    twilio_from_number: "",
    fast2sms_api_key: "",
    fast2sms_api_key_set: false,
    fast2sms_sender_id: "",
    push_enabled: false,
    push_provider: "none" as "none" | "fcm",
    fcm_server_key: "",
    fcm_server_key_set: false,
    order_confirm_subject: "",
    order_confirm_body: "",
    invoice_email_subject: "",
    invoice_email_body: "",
    notify_order_placed: true,
    notify_payment_received: true,
    notify_shipped: true,
    event_queue_enabled: false,
    clear_smtp_password: false,
    clear_twilio_auth_token: false,
    clear_fast2sms_api_key: false,
    clear_fcm_server_key: false,
  });
  const [securitySettings, setSecuritySettings] = useState({
    admin_two_factor_enabled: false,
    ip_allowlist_enabled: false,
    ip_allowlist_text: "",
    login_max_attempts: 10,
    login_lockout_minutes: 15,
    password_min_length: 8,
    password_require_upper: false,
    password_require_lower: false,
    password_require_number: false,
    password_require_symbol: false,
    session_timeout_minutes: 10080,
    audit_log_enabled: false,
    audit_log_retention_days: 90,
  });
  const [analyticsSettings, setAnalyticsSettings] = useState({
    google_analytics_id: "",
    facebook_pixel_id: "",
    conversion_track_purchase: true,
    conversion_track_add_to_cart: true,
    conversion_track_begin_checkout: true,
  });

  useEffect(() => {
    getCategories()
      .then((rows) => {
        if (Array.isArray(rows)) setCategories(rows as { id: number; name: string; slug: string }[]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    adminGetSettings()
      .then((d) => {
        if (!d) return;
        if (d.general) setGeneral((g) => ({ ...g, ...d.general }));
        if (d.payment) setPayment((p) => ({ ...p, ...d.payment }));
        if (d.shipping) setShipping((s) => ({ ...s, ...d.shipping }));
        if (d.product_catalog && typeof d.product_catalog === "object") {
          const pc = d.product_catalog as Record<string, unknown>;
          const rawCat = pc.default_import_category_id;
          let catId: number | null = null;
          if (rawCat !== null && rawCat !== undefined && rawCat !== "") {
            const n = Number(rawCat);
            if (Number.isFinite(n) && n > 0) catId = n;
          }
          setProductCatalog({
            default_import_category_id: catId,
            sku_auto_generate: Boolean(pc.sku_auto_generate),
            sku_prefix: String(pc.sku_prefix ?? "BF-").slice(0, 50),
            inventory_alerts_enabled: Boolean(pc.inventory_alerts_enabled),
            inventory_low_threshold: Math.max(0, Number(pc.inventory_low_threshold) || 10),
            csv_bulk_upload_enabled: Boolean(pc.csv_bulk_upload_enabled),
          });
        }
        if (d.backup && typeof d.backup === "object") {
          const b = d.backup as Record<string, unknown>;
          const freq = String(b.scheduled_local_frequency ?? "none");
          const prov = String(b.cloud_provider ?? "none");
          setBackup({
            scheduled_local_enabled: Boolean(b.scheduled_local_enabled),
            scheduled_local_frequency: ["none", "daily", "weekly"].includes(freq)
              ? (freq as "none" | "daily" | "weekly")
              : "none",
            local_retention_days: Math.min(365, Math.max(1, Number(b.local_retention_days) || 7)),
            cloud_backup_enabled: Boolean(b.cloud_backup_enabled),
            cloud_provider: ["none", "s3", "gcs", "gdrive"].includes(prov)
              ? (prov as "none" | "s3" | "gcs" | "gdrive")
              : "none",
          });
        }
        if (d.maintenance && typeof d.maintenance === "object") {
          const m = d.maintenance as Record<string, unknown>;
          setMaintenance({
            enabled: Boolean(m.enabled),
            message:
              String(m.message ?? "").trim() ||
              "We're making improvements. Please check back soon.",
          });
        }
        if (d.api_integrations && typeof d.api_integrations === "object") {
          const a = d.api_integrations as Record<string, unknown>;
          setApiIntegrations({
            rest_api_enabled: Boolean(a.rest_api_enabled),
            webhook_erp_url: String(a.webhook_erp_url ?? ""),
            webhook_crm_url: String(a.webhook_crm_url ?? ""),
            shiprocket_enabled: Boolean(a.shiprocket_enabled),
            shiprocket_webhook_url: String(a.shiprocket_webhook_url ?? ""),
            delhivery_enabled: Boolean(a.delhivery_enabled),
            delhivery_webhook_url: String(a.delhivery_webhook_url ?? ""),
          });
        }
        if (d.coupon_defaults && typeof d.coupon_defaults === "object") {
          const c = d.coupon_defaults as Record<string, unknown>;
          const mo = c.auto_apply_min_order;
          const rawMode = String(c.coupon_apply_mode ?? "").toLowerCase();
          const mode: "auto" | "select" | "code_only" =
            rawMode === "auto" || rawMode === "select"
              ? rawMode
              : c.auto_apply_enabled
                ? "auto"
                : "code_only";
          setCouponDefaults({
            coupon_apply_mode: mode,
            auto_apply_min_order:
              mo === null || mo === undefined || mo === "" ? "" : String(mo),
            user_specific_codes_enabled: Boolean(c.user_specific_codes_enabled),
          });
        }
        if (d.invoice_tax && typeof d.invoice_tax === "object") {
          const x = d.invoice_tax as Record<string, unknown>;
          const sch = String(x.tax_scheme ?? "gst").toLowerCase();
          setInvoiceTax({
            tax_scheme: ["gst", "vat", "none"].includes(sch) ? (sch as "gst" | "vat" | "none") : "gst",
            tax_label: String(x.tax_label ?? "GST").slice(0, 50),
            default_tax_rate_percent:
              x.default_tax_rate_percent === null || x.default_tax_rate_percent === undefined
                ? ""
                : String(x.default_tax_rate_percent),
            prices_tax_inclusive: Boolean(x.prices_tax_inclusive),
            invoice_prefix: String(x.invoice_prefix ?? "INV-").slice(0, 50),
            invoice_number_padding: String(x.invoice_number_padding ?? 4),
            pdf_company_name: String(x.pdf_company_name ?? ""),
            pdf_logo_url: String(x.pdf_logo_url ?? ""),
            per_product_tax_enabled: Boolean(x.per_product_tax_enabled),
            invoice_template: String(x.invoice_template ?? "classic"),
          });
        }
        if (d.ui_theme && typeof d.ui_theme === "object") {
          const u = d.ui_theme as Record<string, unknown>;
          const modeRaw = String(u.theme_mode ?? "light").toLowerCase();
          const layoutRaw = String(u.layout_preset ?? "default").toLowerCase();
          setUiTheme({
            theme_mode: ["light", "dark", "system"].includes(modeRaw)
              ? (modeRaw as "light" | "dark" | "system")
              : "light",
            primary_color: String(u.primary_color ?? "#16a34a"),
            layout_preset: ["default", "compact", "wide"].includes(layoutRaw)
              ? (layoutRaw as "default" | "compact" | "wide")
              : "default",
            custom_css: String(u.custom_css ?? ""),
            custom_js: String(u.custom_js ?? ""),
          });
        }
        if (d.email_notifications && typeof d.email_notifications === "object") {
          const e = d.email_notifications as Record<string, unknown>;
          const sms = String(e.sms_provider ?? "none").toLowerCase();
          const push = String(e.push_provider ?? "none").toLowerCase();
          setEmailNotifications((prev) => ({
            ...prev,
            smtp_enabled: Boolean(e.smtp_enabled),
            smtp_host: String(e.smtp_host ?? ""),
            smtp_port: Math.min(65535, Math.max(1, Number(e.smtp_port) || 587)),
            smtp_tls: e.smtp_tls !== false,
            smtp_user: String(e.smtp_user ?? ""),
            smtp_password: "",
            smtp_password_set: Boolean(e.smtp_password_set),
            smtp_from_email: String(e.smtp_from_email ?? ""),
            smtp_from_name: String(e.smtp_from_name ?? ""),
            sms_provider: ["none", "twilio", "fast2sms"].includes(sms)
              ? (sms as "none" | "twilio" | "fast2sms")
              : "none",
            twilio_account_sid: String(e.twilio_account_sid ?? ""),
            twilio_auth_token: "",
            twilio_auth_token_set: Boolean(e.twilio_auth_token_set),
            twilio_from_number: String(e.twilio_from_number ?? ""),
            fast2sms_api_key: "",
            fast2sms_api_key_set: Boolean(e.fast2sms_api_key_set),
            fast2sms_sender_id: String(e.fast2sms_sender_id ?? ""),
            push_enabled: Boolean(e.push_enabled),
            push_provider: push === "fcm" ? "fcm" : "none",
            fcm_server_key: "",
            fcm_server_key_set: Boolean(e.fcm_server_key_set),
            order_confirm_subject: String(e.order_confirm_subject ?? ""),
            order_confirm_body: String(e.order_confirm_body ?? ""),
            invoice_email_subject: String(e.invoice_email_subject ?? ""),
            invoice_email_body: String(e.invoice_email_body ?? ""),
            notify_order_placed: e.notify_order_placed !== false,
            notify_payment_received: e.notify_payment_received !== false,
            notify_shipped: e.notify_shipped !== false,
            event_queue_enabled: Boolean(e.event_queue_enabled),
            clear_smtp_password: false,
            clear_twilio_auth_token: false,
            clear_fast2sms_api_key: false,
            clear_fcm_server_key: false,
          }));
        }
        if (d.security && typeof d.security === "object") {
          const s = d.security as Record<string, unknown>;
          setSecuritySettings({
            admin_two_factor_enabled: Boolean(s.admin_two_factor_enabled),
            ip_allowlist_enabled: Boolean(s.ip_allowlist_enabled),
            ip_allowlist_text: String(s.ip_allowlist_text ?? ""),
            login_max_attempts: Math.min(100, Math.max(1, Number(s.login_max_attempts) || 10)),
            login_lockout_minutes: Math.min(1440, Math.max(1, Number(s.login_lockout_minutes) || 15)),
            password_min_length: Math.min(128, Math.max(6, Number(s.password_min_length) || 8)),
            password_require_upper: Boolean(s.password_require_upper),
            password_require_lower: Boolean(s.password_require_lower),
            password_require_number: Boolean(s.password_require_number),
            password_require_symbol: Boolean(s.password_require_symbol),
            session_timeout_minutes: Math.min(
              525600,
              Math.max(5, Number(s.session_timeout_minutes) || 10080)
            ),
            audit_log_enabled: Boolean(s.audit_log_enabled),
            audit_log_retention_days: Math.min(
              3650,
              Math.max(1, Number(s.audit_log_retention_days) || 90)
            ),
          });
        }
        if (d.analytics && typeof d.analytics === "object") {
          const x = d.analytics as Record<string, unknown>;
          setAnalyticsSettings({
            google_analytics_id: String(x.google_analytics_id ?? ""),
            facebook_pixel_id: String(x.facebook_pixel_id ?? ""),
            conversion_track_purchase: x.conversion_track_purchase !== false,
            conversion_track_add_to_cart: x.conversion_track_add_to_cart !== false,
            conversion_track_begin_checkout: x.conversion_track_begin_checkout !== false,
          });
        }
      })
      .catch((err: unknown) => {
        const res = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
        const status = res?.status;
        const msg = res?.data?.message;
        if (status === 403) {
          toast.error("Admin access required — sign in with an admin account.");
        } else {
          toast.error(msg ?? "Could not load settings. Try: npx prisma db push && npx prisma generate");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async (
    part:
      | "general"
      | "payment"
      | "shipping"
      | "product_catalog"
      | "backup"
      | "maintenance"
      | "api_integrations"
      | "coupon_defaults"
      | "invoice_tax"
      | "ui_theme"
      | "email_notifications"
      | "security"
      | "analytics"
  ) => {
    setSaving(true);
    try {
      await adminUpdateSettings({
        ...(part === "general" ? { general } : {}),
        ...(part === "payment" ? { payment } : {}),
        ...(part === "shipping" ? { shipping } : {}),
        ...(part === "product_catalog" ? { product_catalog: productCatalog } : {}),
        ...(part === "backup" ? { backup } : {}),
        ...(part === "maintenance" ? { maintenance } : {}),
        ...(part === "api_integrations" ? { api_integrations: apiIntegrations } : {}),
        ...(part === "coupon_defaults"
          ? {
              coupon_defaults: {
                coupon_apply_mode: couponDefaults.coupon_apply_mode,
                user_specific_codes_enabled: couponDefaults.user_specific_codes_enabled,
                auto_apply_min_order: (() => {
                  const t = couponDefaults.auto_apply_min_order.trim();
                  if (t === "") return null;
                  const n = Number(t);
                  return Number.isFinite(n) && n >= 0 ? n : null;
                })(),
              },
            }
          : {}),
        ...(part === "invoice_tax"
          ? {
              invoice_tax: {
                tax_scheme: invoiceTax.tax_scheme,
                tax_label: invoiceTax.tax_label,
                default_tax_rate_percent: (() => {
                  const t = invoiceTax.default_tax_rate_percent.trim();
                  if (t === "") return 0;
                  const n = Number(t);
                  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 0;
                })(),
                prices_tax_inclusive: invoiceTax.prices_tax_inclusive,
                invoice_prefix: invoiceTax.invoice_prefix,
                invoice_number_padding: (() => {
                  const n = Number(invoiceTax.invoice_number_padding);
                  return Number.isFinite(n) && n >= 1 && n <= 12 ? Math.floor(n) : 4;
                })(),
                pdf_company_name: invoiceTax.pdf_company_name,
                pdf_logo_url: invoiceTax.pdf_logo_url,
                per_product_tax_enabled: invoiceTax.per_product_tax_enabled,
                invoice_template: invoiceTax.invoice_template,
              },
            }
          : {}),
        ...(part === "ui_theme"
          ? {
              ui_theme: {
                theme_mode: uiTheme.theme_mode,
                primary_color: uiTheme.primary_color,
                layout_preset: uiTheme.layout_preset,
                custom_css: uiTheme.custom_css,
                custom_js: uiTheme.custom_js,
              },
            }
          : {}),
        ...(part === "email_notifications"
          ? {
              email_notifications: {
                smtp_enabled: emailNotifications.smtp_enabled,
                smtp_host: emailNotifications.smtp_host,
                smtp_port: emailNotifications.smtp_port,
                smtp_tls: emailNotifications.smtp_tls,
                smtp_user: emailNotifications.smtp_user,
                smtp_from_email: emailNotifications.smtp_from_email,
                smtp_from_name: emailNotifications.smtp_from_name,
                sms_provider: emailNotifications.sms_provider,
                twilio_account_sid: emailNotifications.twilio_account_sid,
                twilio_from_number: emailNotifications.twilio_from_number,
                fast2sms_sender_id: emailNotifications.fast2sms_sender_id,
                push_enabled: emailNotifications.push_enabled,
                push_provider: emailNotifications.push_provider,
                order_confirm_subject: emailNotifications.order_confirm_subject,
                order_confirm_body: emailNotifications.order_confirm_body,
                invoice_email_subject: emailNotifications.invoice_email_subject,
                invoice_email_body: emailNotifications.invoice_email_body,
                notify_order_placed: emailNotifications.notify_order_placed,
                notify_payment_received: emailNotifications.notify_payment_received,
                notify_shipped: emailNotifications.notify_shipped,
                event_queue_enabled: emailNotifications.event_queue_enabled,
                ...(emailNotifications.smtp_password.trim()
                  ? { smtp_password: emailNotifications.smtp_password.trim() }
                  : {}),
                ...(emailNotifications.twilio_auth_token.trim()
                  ? { twilio_auth_token: emailNotifications.twilio_auth_token.trim() }
                  : {}),
                ...(emailNotifications.fast2sms_api_key.trim()
                  ? { fast2sms_api_key: emailNotifications.fast2sms_api_key.trim() }
                  : {}),
                ...(emailNotifications.fcm_server_key.trim()
                  ? { fcm_server_key: emailNotifications.fcm_server_key.trim() }
                  : {}),
                ...(emailNotifications.clear_smtp_password ? { clear_smtp_password: true } : {}),
                ...(emailNotifications.clear_twilio_auth_token ? { clear_twilio_auth_token: true } : {}),
                ...(emailNotifications.clear_fast2sms_api_key ? { clear_fast2sms_api_key: true } : {}),
                ...(emailNotifications.clear_fcm_server_key ? { clear_fcm_server_key: true } : {}),
              },
            }
          : {}),
        ...(part === "security"
          ? {
              security: {
                admin_two_factor_enabled: securitySettings.admin_two_factor_enabled,
                ip_allowlist_enabled: securitySettings.ip_allowlist_enabled,
                ip_allowlist_text: securitySettings.ip_allowlist_text,
                login_max_attempts: securitySettings.login_max_attempts,
                login_lockout_minutes: securitySettings.login_lockout_minutes,
                password_min_length: securitySettings.password_min_length,
                password_require_upper: securitySettings.password_require_upper,
                password_require_lower: securitySettings.password_require_lower,
                password_require_number: securitySettings.password_require_number,
                password_require_symbol: securitySettings.password_require_symbol,
                session_timeout_minutes: securitySettings.session_timeout_minutes,
                audit_log_enabled: securitySettings.audit_log_enabled,
                audit_log_retention_days: securitySettings.audit_log_retention_days,
              },
            }
          : {}),
        ...(part === "analytics"
          ? {
              analytics: {
                google_analytics_id: analyticsSettings.google_analytics_id,
                facebook_pixel_id: analyticsSettings.facebook_pixel_id,
                conversion_track_purchase: analyticsSettings.conversion_track_purchase,
                conversion_track_add_to_cart: analyticsSettings.conversion_track_add_to_cart,
                conversion_track_begin_checkout: analyticsSettings.conversion_track_begin_checkout,
              },
            }
          : {}),
      });
      toast.success("Settings saved");
      if (part === "email_notifications") {
        setEmailNotifications((e) => {
          const next = {
            ...e,
            smtp_password: "",
            twilio_auth_token: "",
            fast2sms_api_key: "",
            fcm_server_key: "",
            clear_smtp_password: false,
            clear_twilio_auth_token: false,
            clear_fast2sms_api_key: false,
            clear_fcm_server_key: false,
          };
          if (e.smtp_password.trim()) next.smtp_password_set = true;
          else if (e.clear_smtp_password) next.smtp_password_set = false;
          if (e.twilio_auth_token.trim()) next.twilio_auth_token_set = true;
          else if (e.clear_twilio_auth_token) next.twilio_auth_token_set = false;
          if (e.fast2sms_api_key.trim()) next.fast2sms_api_key_set = true;
          else if (e.clear_fast2sms_api_key) next.fast2sms_api_key_set = false;
          if (e.fcm_server_key.trim()) next.fcm_server_key_set = true;
          else if (e.clear_fcm_server_key) next.fcm_server_key_set = false;
          return next;
        });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const uploadBranding = async (file: File, field: "logo" | "favicon") => {
    try {
      const url = await uploadImage(file, "branding");
      setGeneral((g) => ({ ...g, [field]: url }));
      toast.success("File uploaded — click Save to apply");
    } catch {
      toast.error("Upload failed");
    }
  };

  const uploadInvoicePdfLogo = async (file: File) => {
    try {
      const url = await uploadImage(file, "branding");
      setInvoiceTax((t) => ({ ...t, pdf_logo_url: url }));
      toast.success("Logo uploaded — click Save invoice & tax to apply");
    } catch {
      toast.error("Upload failed");
    }
  };

  const input = "w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300";
  const label = "text-xs text-gray-500 mb-1 block font-medium";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        Loading settings…
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl">
      <aside className="lg:w-56 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-6 h-6 text-green-600" />
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        </div>
        <nav className="space-y-0.5">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-left transition-colors",
                section === item.id ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 space-y-6">
        {section === "general" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">General</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={label} htmlFor="settings-general-site-name">
                  Site name
                </label>
                <input
                  id="settings-general-site-name"
                  className={input}
                  placeholder="Store name"
                  value={general.site_name}
                  onChange={(e) => setGeneral((g) => ({ ...g, site_name: e.target.value }))}
                />
              </div>
              <div>
                <label className={label} htmlFor="settings-general-email">
                  Contact email
                </label>
                <input
                  id="settings-general-email"
                  type="email"
                  autoComplete="email"
                  placeholder="contact@example.com"
                  className={input}
                  value={general.email}
                  onChange={(e) => setGeneral((g) => ({ ...g, email: e.target.value }))}
                />
              </div>
              <div>
                <label className={label} htmlFor="settings-general-phone">
                  Phone
                </label>
                <input
                  id="settings-general-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 …"
                  className={input}
                  value={general.phone}
                  onChange={(e) => setGeneral((g) => ({ ...g, phone: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="settings-general-address">
                  Address
                </label>
                <textarea
                  id="settings-general-address"
                  className={`${input} min-h-[80px]`}
                  placeholder="Business address"
                  value={general.address}
                  onChange={(e) => setGeneral((g) => ({ ...g, address: e.target.value }))}
                />
              </div>
              <div>
                <label className={label} htmlFor="settings-general-timezone">
                  Timezone
                </label>
                <select
                  id="settings-general-timezone"
                  className={input}
                  value={general.timezone}
                  onChange={(e) => setGeneral((g) => ({ ...g, timezone: e.target.value }))}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="settings-general-language">
                  Language
                </label>
                <select
                  id="settings-general-language"
                  className={input}
                  value={general.language}
                  onChange={(e) => setGeneral((g) => ({ ...g, language: e.target.value }))}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className={label}>Logo</span>
                {general.logo ? <p className="text-xs text-gray-500 mb-1 truncate">{general.logo}</p> : null}
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 text-sm">
                  <Upload className="w-4 h-4" aria-hidden />
                  Upload logo
                  <input
                    id="settings-general-logo-file"
                    type="file"
                    accept="image/*"
                    title="Upload logo image"
                    aria-label="Upload logo image"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadBranding(f, "logo"); e.target.value = ""; }}
                  />
                </label>
              </div>
              <div>
                <span className={label}>Favicon</span>
                {general.favicon ? <p className="text-xs text-gray-500 mb-1 truncate">{general.favicon}</p> : null}
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 text-sm">
                  <Upload className="w-4 h-4" aria-hidden />
                  Upload favicon
                  <input
                    id="settings-general-favicon-file"
                    type="file"
                    accept="image/*"
                    title="Upload favicon image"
                    aria-label="Upload favicon image"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadBranding(f, "favicon"); e.target.value = ""; }}
                  />
                </label>
              </div>
            </div>
            <button type="button" disabled={saving} onClick={() => save("general")} className="mt-6 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
              {saving ? "Saving…" : "Save general"}
            </button>
          </div>
        )}

        {section === "payment" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Payment gateways</h2>
            <p className="text-sm text-gray-500">
              Razorpay API keys stay in <code className="bg-gray-100 px-1 rounded">.env</code> (
              <code className="bg-gray-100 px-1">NEXT_PUBLIC_RAZORPAY_KEY_ID</code>,{" "}
              <code className="bg-gray-100 px-1">RAZORPAY_KEY_SECRET</code>). Toggle which methods customers see at checkout.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label} htmlFor="settings-payment-currency">
                  Currency
                </label>
                <select
                  id="settings-payment-currency"
                  className={input}
                  value={payment.currency}
                  onChange={(e) => setPayment((p) => ({ ...p, currency: e.target.value }))}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div className="sm:col-span-2 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={payment.cod_enabled} onChange={(e) => setPayment((p) => ({ ...p, cod_enabled: e.target.checked }))} className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="text-sm text-gray-800">Cash on Delivery (COD)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={payment.razorpay_enabled} onChange={(e) => setPayment((p) => ({ ...p, razorpay_enabled: e.target.checked }))} className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="text-sm text-gray-800">Razorpay (cards, UPI, netbanking)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={payment.stripe_enabled} onChange={(e) => setPayment((p) => ({ ...p, stripe_enabled: e.target.checked }))} className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="text-sm text-gray-800">Stripe (roadmap — toggle only)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={payment.paypal_enabled} onChange={(e) => setPayment((p) => ({ ...p, paypal_enabled: e.target.checked }))} className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="text-sm text-gray-800">PayPal (roadmap — toggle only)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={payment.auto_refund_enabled} onChange={(e) => setPayment((p) => ({ ...p, auto_refund_enabled: e.target.checked }))} className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="text-sm text-gray-800">Auto-refund workflow (future)</span>
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="settings-payment-razorpay-webhook">
                  Razorpay webhook URL (for your server endpoint)
                </label>
                <input
                  id="settings-payment-razorpay-webhook"
                  className={input}
                  placeholder="https://…"
                  value={payment.razorpay_webhook_url}
                  onChange={(e) => setPayment((p) => ({ ...p, razorpay_webhook_url: e.target.value }))}
                />
              </div>
            </div>
            <button type="button" disabled={saving} onClick={() => save("payment")} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
              {saving ? "Saving…" : "Save payment"}
            </button>
          </div>
        )}

        {section === "shipping" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Shipping & delivery</h2>
            <p className="text-sm text-gray-500">
              Flat rate and free-shipping threshold are used by checkout and cart estimates. Express ETA is shown to customers as text.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label} htmlFor="settings-shipping-flat-rate">
                  Flat shipping rate (₹)
                </label>
                <input
                  id="settings-shipping-flat-rate"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="0"
                  className={input}
                  value={shipping.flat_rate}
                  onChange={(e) => setShipping((s) => ({ ...s, flat_rate: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className={label} htmlFor="settings-shipping-free-min">
                  Free shipping from subtotal (₹, after discount)
                </label>
                <input
                  id="settings-shipping-free-min"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="0"
                  className={input}
                  value={shipping.free_shipping_min}
                  onChange={(e) => setShipping((s) => ({ ...s, free_shipping_min: Number(e.target.value) }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="settings-shipping-delivery-eta">
                  Delivery time message (e.g. 20 min – 2 hrs)
                </label>
                <textarea
                  id="settings-shipping-delivery-eta"
                  className={`${input} min-h-[72px]`}
                  value={shipping.delivery_eta_note}
                  onChange={(e) => setShipping((s) => ({ ...s, delivery_eta_note: e.target.value }))}
                  placeholder="Express: ~20 min – 2 hrs where available"
                />
              </div>
            </div>
            <button type="button" disabled={saving} onClick={() => save("shipping")} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
              {saving ? "Saving…" : "Save shipping"}
            </button>
          </div>
        )}

        {section === "email" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-8">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Email &amp; notifications</h2>
              <p className="text-sm text-gray-500 mt-1">
                Store connection details and templates here. Actual sending (SMTP, Twilio, FCM) is not wired yet — workers will read these
                settings from the database when mail/SMS/push ship.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">SMTP (outbound email)</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications.smtp_enabled}
                  onChange={(e) =>
                    setEmailNotifications((x) => ({ ...x, smtp_enabled: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-800">Enable SMTP when mailer is connected</span>
              </label>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="smtp-host">
                    Host
                  </label>
                  <input
                    id="smtp-host"
                    className={input}
                    value={emailNotifications.smtp_host}
                    onChange={(e) => setEmailNotifications((x) => ({ ...x, smtp_host: e.target.value }))}
                    placeholder="smtp.example.com"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className={label} htmlFor="smtp-port">
                    Port
                  </label>
                  <input
                    id="smtp-port"
                    type="number"
                    min={1}
                    max={65535}
                    className={input}
                    value={emailNotifications.smtp_port}
                    onChange={(e) =>
                      setEmailNotifications((x) => ({ ...x, smtp_port: Number(e.target.value) || 587 }))
                    }
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications.smtp_tls}
                      onChange={(e) =>
                        setEmailNotifications((x) => ({ ...x, smtp_tls: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-green-600"
                    />
                    <span className="text-sm text-gray-700">TLS / STARTTLS</span>
                  </label>
                </div>
                <div>
                  <label className={label} htmlFor="smtp-user">
                    Username
                  </label>
                  <input
                    id="smtp-user"
                    className={input}
                    value={emailNotifications.smtp_user}
                    onChange={(e) => setEmailNotifications((x) => ({ ...x, smtp_user: e.target.value }))}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className={label} htmlFor="smtp-password">
                    Password
                  </label>
                  <input
                    id="smtp-password"
                    type="password"
                    className={input}
                    value={emailNotifications.smtp_password}
                    onChange={(e) =>
                      setEmailNotifications((x) => ({ ...x, smtp_password: e.target.value }))
                    }
                    placeholder={emailNotifications.smtp_password_set ? "Leave blank to keep saved password" : "Optional"}
                    autoComplete="new-password"
                  />
                  {emailNotifications.smtp_password_set ? (
                    <p className="text-xs text-gray-400 mt-1">A password is stored. Enter a new value to replace it.</p>
                  ) : null}
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications.clear_smtp_password}
                      onChange={(e) =>
                        setEmailNotifications((x) => ({ ...x, clear_smtp_password: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-green-600"
                    />
                    <span className="text-xs text-gray-600">Remove stored SMTP password on save</span>
                  </label>
                </div>
                <div>
                  <label className={label} htmlFor="smtp-from-email">
                    From email
                  </label>
                  <input
                    id="smtp-from-email"
                    type="email"
                    className={input}
                    value={emailNotifications.smtp_from_email}
                    onChange={(e) =>
                      setEmailNotifications((x) => ({ ...x, smtp_from_email: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={label} htmlFor="smtp-from-name">
                    From name
                  </label>
                  <input
                    id="smtp-from-name"
                    className={input}
                    value={emailNotifications.smtp_from_name}
                    onChange={(e) =>
                      setEmailNotifications((x) => ({ ...x, smtp_from_name: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">SMS</h3>
              <div>
                <label className={label} htmlFor="sms-provider">
                  Provider
                </label>
                <select
                  id="sms-provider"
                  className={input}
                  value={emailNotifications.sms_provider}
                  onChange={(e) =>
                    setEmailNotifications((x) => ({
                      ...x,
                      sms_provider: e.target.value as "none" | "twilio" | "fast2sms",
                    }))
                  }
                >
                  <option value="none">None</option>
                  <option value="twilio">Twilio</option>
                  <option value="fast2sms">Fast2SMS (India)</option>
                </select>
              </div>
              {emailNotifications.sms_provider === "twilio" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={label} htmlFor="twilio-sid">
                      Account SID
                    </label>
                    <input
                      id="twilio-sid"
                      className={input}
                      value={emailNotifications.twilio_account_sid}
                      onChange={(e) =>
                        setEmailNotifications((x) => ({ ...x, twilio_account_sid: e.target.value }))
                      }
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className={label} htmlFor="twilio-token">
                      Auth token
                    </label>
                    <input
                      id="twilio-token"
                      type="password"
                      className={input}
                      value={emailNotifications.twilio_auth_token}
                      onChange={(e) =>
                        setEmailNotifications((x) => ({ ...x, twilio_auth_token: e.target.value }))
                      }
                      placeholder={
                        emailNotifications.twilio_auth_token_set ? "Leave blank to keep" : "Optional"
                      }
                      autoComplete="off"
                    />
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications.clear_twilio_auth_token}
                        onChange={(e) =>
                          setEmailNotifications((x) => ({
                            ...x,
                            clear_twilio_auth_token: e.target.checked,
                          }))
                        }
                        className="rounded border-gray-300 text-green-600"
                      />
                      <span className="text-xs text-gray-600">Remove stored token on save</span>
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={label} htmlFor="twilio-from">
                      From number (E.164)
                    </label>
                    <input
                      id="twilio-from"
                      className={input}
                      value={emailNotifications.twilio_from_number}
                      onChange={(e) =>
                        setEmailNotifications((x) => ({ ...x, twilio_from_number: e.target.value }))
                      }
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              )}
              {emailNotifications.sms_provider === "fast2sms" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={label} htmlFor="fast2sms-key">
                      API key
                    </label>
                    <input
                      id="fast2sms-key"
                      type="password"
                      className={input}
                      value={emailNotifications.fast2sms_api_key}
                      onChange={(e) =>
                        setEmailNotifications((x) => ({ ...x, fast2sms_api_key: e.target.value }))
                      }
                      placeholder={emailNotifications.fast2sms_api_key_set ? "Leave blank to keep" : ""}
                    />
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications.clear_fast2sms_api_key}
                        onChange={(e) =>
                          setEmailNotifications((x) => ({
                            ...x,
                            clear_fast2sms_api_key: e.target.checked,
                          }))
                        }
                        className="rounded border-gray-300 text-green-600"
                      />
                      <span className="text-xs text-gray-600">Remove stored API key on save</span>
                    </label>
                  </div>
                  <div>
                    <label className={label} htmlFor="fast2sms-sender">
                      Sender ID
                    </label>
                    <input
                      id="fast2sms-sender"
                      className={input}
                      value={emailNotifications.fast2sms_sender_id}
                      onChange={(e) =>
                        setEmailNotifications((x) => ({ ...x, fast2sms_sender_id: e.target.value }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Push notifications</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications.push_enabled}
                  onChange={(e) =>
                    setEmailNotifications((x) => ({ ...x, push_enabled: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-800">Enable push when FCM is wired</span>
              </label>
              <div>
                <label className={label} htmlFor="push-provider">
                  Provider
                </label>
                <select
                  id="push-provider"
                  className={input}
                  value={emailNotifications.push_provider}
                  onChange={(e) =>
                    setEmailNotifications((x) => ({
                      ...x,
                      push_provider: e.target.value as "none" | "fcm",
                    }))
                  }
                >
                  <option value="none">None</option>
                  <option value="fcm">Firebase Cloud Messaging</option>
                </select>
              </div>
              {emailNotifications.push_provider === "fcm" && (
                <div>
                  <label className={label} htmlFor="fcm-key">
                    FCM server key
                  </label>
                  <input
                    id="fcm-key"
                    type="password"
                    className={input}
                    value={emailNotifications.fcm_server_key}
                    onChange={(e) =>
                      setEmailNotifications((x) => ({ ...x, fcm_server_key: e.target.value }))
                    }
                    placeholder={emailNotifications.fcm_server_key_set ? "Leave blank to keep" : ""}
                  />
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications.clear_fcm_server_key}
                      onChange={(e) =>
                        setEmailNotifications((x) => ({ ...x, clear_fcm_server_key: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-green-600"
                    />
                    <span className="text-xs text-gray-600">Remove stored key on save</span>
                  </label>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Order &amp; invoice email templates</h3>
              <p className="text-xs text-gray-500">
                Placeholders: {"{{order_number}}"}, {"{{customer_name}}"}, {"{{order_total}}"}, {"{{site_name}}"} (substitution when templates are used).
              </p>
              <div className="grid gap-4">
                <div>
                  <label className={label} htmlFor="tpl-order-subj">
                    Order confirmation — subject
                  </label>
                  <input
                    id="tpl-order-subj"
                    className={input}
                    value={emailNotifications.order_confirm_subject}
                    onChange={(e) =>
                      setEmailNotifications((x) => ({ ...x, order_confirm_subject: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={label} htmlFor="tpl-order-body">
                    Order confirmation — body
                  </label>
                  <textarea
                    id="tpl-order-body"
                    className={`${input} min-h-[120px] font-mono text-xs`}
                    value={emailNotifications.order_confirm_body}
                    onChange={(e) =>
                      setEmailNotifications((x) => ({ ...x, order_confirm_body: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={label} htmlFor="tpl-inv-subj">
                    Invoice email — subject
                  </label>
                  <input
                    id="tpl-inv-subj"
                    className={input}
                    value={emailNotifications.invoice_email_subject}
                    onChange={(e) =>
                      setEmailNotifications((x) => ({ ...x, invoice_email_subject: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={label} htmlFor="tpl-inv-body">
                    Invoice email — body
                  </label>
                  <textarea
                    id="tpl-inv-body"
                    className={`${input} min-h-[120px] font-mono text-xs`}
                    value={emailNotifications.invoice_email_body}
                    onChange={(e) =>
                      setEmailNotifications((x) => ({ ...x, invoice_email_body: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Event triggers &amp; queues</h3>
              <p className="text-xs text-gray-500 mb-2">
                Toggles for future notification jobs. When a background queue is added, it can respect these flags.
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications.notify_order_placed}
                    onChange={(e) =>
                      setEmailNotifications((x) => ({ ...x, notify_order_placed: e.target.checked }))
                    }
                    className="rounded border-gray-300 text-green-600"
                  />
                  <span className="text-sm text-gray-800">Notify on order placed</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications.notify_payment_received}
                    onChange={(e) =>
                      setEmailNotifications((x) => ({ ...x, notify_payment_received: e.target.checked }))
                    }
                    className="rounded border-gray-300 text-green-600"
                  />
                  <span className="text-sm text-gray-800">Notify on payment received</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications.notify_shipped}
                    onChange={(e) =>
                      setEmailNotifications((x) => ({ ...x, notify_shipped: e.target.checked }))
                    }
                    className="rounded border-gray-300 text-green-600"
                  />
                  <span className="text-sm text-gray-800">Notify on shipped</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications.event_queue_enabled}
                    onChange={(e) =>
                      setEmailNotifications((x) => ({ ...x, event_queue_enabled: e.target.checked }))
                    }
                    className="rounded border-gray-300 text-green-600"
                  />
                  <span className="text-sm text-gray-800">Prefer background queue for notifications (future)</span>
                </label>
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => save("email_notifications")}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save email & notifications"}
            </button>
          </div>
        )}
        {section === "security" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-8">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Security</h2>
              <p className="text-sm text-gray-500 mt-1">
                Store policy here for when login, sessions, and auditing are wired to these values. Changing options alone does not
                enable 2FA, IP filtering, or lockout until the auth layer uses them.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Two-factor authentication (admin)</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={securitySettings.admin_two_factor_enabled}
                  onChange={(e) =>
                    setSecuritySettings((x) => ({ ...x, admin_two_factor_enabled: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-800">Require 2FA for admin accounts (when TOTP is implemented)</span>
              </label>
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">IP allowlist (admin)</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={securitySettings.ip_allowlist_enabled}
                  onChange={(e) =>
                    setSecuritySettings((x) => ({ ...x, ip_allowlist_enabled: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-800">Restrict admin panel to listed IPs (when middleware is enabled)</span>
              </label>
              <div>
                <label className={label} htmlFor="ip-allowlist">
                  Allowed IPs / CIDR (one per line or comma-separated)
                </label>
                <textarea
                  id="ip-allowlist"
                  className={`${input} min-h-[100px] font-mono text-xs`}
                  value={securitySettings.ip_allowlist_text}
                  onChange={(e) =>
                    setSecuritySettings((x) => ({ ...x, ip_allowlist_text: e.target.value }))
                  }
                  placeholder={"203.0.113.10\n198.51.100.0/24"}
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Login attempts &amp; lockout</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={label} htmlFor="login-max">
                    Max failed attempts before lockout
                  </label>
                  <input
                    id="login-max"
                    type="number"
                    min={1}
                    max={100}
                    className={input}
                    value={securitySettings.login_max_attempts}
                    onChange={(e) =>
                      setSecuritySettings((x) => ({
                        ...x,
                        login_max_attempts: Math.min(100, Math.max(1, Number(e.target.value) || 1)),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={label} htmlFor="lockout-min">
                    Lockout duration (minutes)
                  </label>
                  <input
                    id="lockout-min"
                    type="number"
                    min={1}
                    max={1440}
                    className={input}
                    value={securitySettings.login_lockout_minutes}
                    onChange={(e) =>
                      setSecuritySettings((x) => ({
                        ...x,
                        login_lockout_minutes: Math.min(1440, Math.max(1, Number(e.target.value) || 1)),
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Password policy (registration &amp; password changes)</h3>
              <div>
                <label className={label} htmlFor="pwd-min-len">
                  Minimum length
                </label>
                <input
                  id="pwd-min-len"
                  type="number"
                  min={6}
                  max={128}
                  className={input}
                  value={securitySettings.password_min_length}
                  onChange={(e) =>
                    setSecuritySettings((x) => ({
                      ...x,
                      password_min_length: Math.min(128, Math.max(6, Number(e.target.value) || 6)),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.password_require_upper}
                    onChange={(e) =>
                      setSecuritySettings((x) => ({ ...x, password_require_upper: e.target.checked }))
                    }
                    className="rounded border-gray-300 text-green-600"
                  />
                  <span className="text-sm text-gray-800">Require uppercase letter</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.password_require_lower}
                    onChange={(e) =>
                      setSecuritySettings((x) => ({ ...x, password_require_lower: e.target.checked }))
                    }
                    className="rounded border-gray-300 text-green-600"
                  />
                  <span className="text-sm text-gray-800">Require lowercase letter</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.password_require_number}
                    onChange={(e) =>
                      setSecuritySettings((x) => ({ ...x, password_require_number: e.target.checked }))
                    }
                    className="rounded border-gray-300 text-green-600"
                  />
                  <span className="text-sm text-gray-800">Require number</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.password_require_symbol}
                    onChange={(e) =>
                      setSecuritySettings((x) => ({ ...x, password_require_symbol: e.target.checked }))
                    }
                    className="rounded border-gray-300 text-green-600"
                  />
                  <span className="text-sm text-gray-800">Require symbol</span>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Session timeout</h3>
              <div>
                <label className={label} htmlFor="session-timeout">
                  Idle session expiry (minutes)
                </label>
                <input
                  id="session-timeout"
                  type="number"
                  min={5}
                  max={525600}
                  className={input}
                  value={securitySettings.session_timeout_minutes}
                  onChange={(e) =>
                    setSecuritySettings((x) => ({
                      ...x,
                      session_timeout_minutes: Math.min(
                        525600,
                        Math.max(5, Number(e.target.value) || 5)
                      ),
                    }))
                  }
                />
                <p className="text-xs text-gray-400 mt-1">Default 10080 = 7 days. Applied when session expiry is enforced.</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Audit &amp; activity logs</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={securitySettings.audit_log_enabled}
                  onChange={(e) =>
                    setSecuritySettings((x) => ({ ...x, audit_log_enabled: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-800">Enable audit logging (when storage &amp; UI exist)</span>
              </label>
              <div>
                <label className={label} htmlFor="audit-retention">
                  Retention (days)
                </label>
                <input
                  id="audit-retention"
                  type="number"
                  min={1}
                  max={3650}
                  className={input}
                  value={securitySettings.audit_log_retention_days}
                  onChange={(e) =>
                    setSecuritySettings((x) => ({
                      ...x,
                      audit_log_retention_days: Math.min(
                        3650,
                        Math.max(1, Number(e.target.value) || 1)
                      ),
                    }))
                  }
                />
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => save("security")}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save security"}
            </button>
          </div>
        )}
        {section === "ui" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-900">UI / theme</h2>
            <p className="text-sm text-gray-500">
              Controls the public storefront: colour mode, accent colour, content width, and optional custom CSS or JavaScript.
              Visitors may need to refresh the page to pick up changes.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label} htmlFor="ui-theme-mode">
                  Colour mode
                </label>
                <select
                  id="ui-theme-mode"
                  className={input}
                  value={uiTheme.theme_mode}
                  onChange={(e) =>
                    setUiTheme((t) => ({
                      ...t,
                      theme_mode: e.target.value as "light" | "dark" | "system",
                    }))
                  }
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System (follow device)</option>
                </select>
              </div>
              <div>
                <label className={label} htmlFor="ui-layout-preset">
                  Layout
                </label>
                <select
                  id="ui-layout-preset"
                  className={input}
                  value={uiTheme.layout_preset}
                  onChange={(e) =>
                    setUiTheme((t) => ({
                      ...t,
                      layout_preset: e.target.value as "default" | "compact" | "wide",
                    }))
                  }
                >
                  <option value="default">Default</option>
                  <option value="compact">Compact (narrower content)</option>
                  <option value="wide">Wide (more horizontal space)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="ui-primary-color">
                  Primary colour
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    id="ui-primary-color"
                    type="color"
                    className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white p-1"
                    value={
                      /^#[0-9A-Fa-f]{6}$/.test(uiTheme.primary_color.trim())
                        ? uiTheme.primary_color.trim()
                        : "#16a34a"
                    }
                    onChange={(e) => setUiTheme((t) => ({ ...t, primary_color: e.target.value }))}
                  />
                  <input
                    type="text"
                    className={`${input} flex-1 min-w-[140px]`}
                    value={uiTheme.primary_color}
                    onChange={(e) => setUiTheme((t) => ({ ...t, primary_color: e.target.value }))}
                    placeholder="#16a34a"
                    spellCheck={false}
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="ui-custom-css">
                  Custom CSS (advanced)
                </label>
                <textarea
                  id="ui-custom-css"
                  className={`${input} min-h-[120px] font-mono text-xs`}
                  value={uiTheme.custom_css}
                  onChange={(e) => setUiTheme((t) => ({ ...t, custom_css: e.target.value }))}
                  placeholder="/* Appended to the storefront as a style block */"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {uiTheme.custom_css.length} / 32 000 characters
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="ui-custom-js">
                  Custom JavaScript (advanced)
                </label>
                <textarea
                  id="ui-custom-js"
                  className={`${input} min-h-[100px] font-mono text-xs`}
                  value={uiTheme.custom_js}
                  onChange={(e) => setUiTheme((t) => ({ ...t, custom_js: e.target.value }))}
                  placeholder="// Runs once on the storefront after load"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {uiTheme.custom_js.length} / 32 000 characters — use with care; only trusted code.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => save("ui_theme")}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save UI / theme"}
            </button>
          </div>
        )}
        {section === "analytics" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Analytics &amp; tracking</h2>
              <p className="text-sm text-gray-500 mt-1">
                GA4 / Universal Analytics and Meta Pixel load on the storefront from saved IDs. Invalid IDs are ignored. Conversion toggles are
                exposed on <code className="text-xs bg-gray-100 px-1 rounded">window.__BF_ANALYTICS__</code> for cart/checkout hooks.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={label} htmlFor="ga-id">
                  Google Analytics measurement ID
                </label>
                <input
                  id="ga-id"
                  className={input}
                  value={analyticsSettings.google_analytics_id}
                  onChange={(e) =>
                    setAnalyticsSettings((x) => ({ ...x, google_analytics_id: e.target.value }))
                  }
                  placeholder="G-XXXXXXXXXX or UA-XXXXXXX-X"
                  autoComplete="off"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="fb-pixel">
                  Facebook (Meta) Pixel ID
                </label>
                <input
                  id="fb-pixel"
                  className={input}
                  value={analyticsSettings.facebook_pixel_id}
                  onChange={(e) =>
                    setAnalyticsSettings((x) => ({ ...x, facebook_pixel_id: e.target.value }))
                  }
                  placeholder="Numeric pixel ID"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="border-t border-gray-100 pt-5 space-y-2">
              <h3 className="text-sm font-semibold text-gray-800">Conversion events (for gtag / fbq hooks)</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsSettings.conversion_track_purchase}
                  onChange={(e) =>
                    setAnalyticsSettings((x) => ({ ...x, conversion_track_purchase: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-green-600"
                />
                <span className="text-sm text-gray-800">Track purchase</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsSettings.conversion_track_add_to_cart}
                  onChange={(e) =>
                    setAnalyticsSettings((x) => ({ ...x, conversion_track_add_to_cart: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-green-600"
                />
                <span className="text-sm text-gray-800">Track add to cart</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsSettings.conversion_track_begin_checkout}
                  onChange={(e) =>
                    setAnalyticsSettings((x) => ({
                      ...x,
                      conversion_track_begin_checkout: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-green-600"
                />
                <span className="text-sm text-gray-800">Track begin checkout</span>
              </label>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => save("analytics")}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save analytics"}
            </button>
          </div>
        )}
        {section === "invoice" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-900">Invoice &amp; tax</h2>
            <p className="text-sm text-gray-500">
              Defaults for future PDF invoices and tax display. Orders and products are not recalculated — checkout prices stay as
              they are until tax logic is connected.
            </p>
            <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
              GST/VAT handling on receipts and per-product tax columns will use these values when invoice generation ships.
            </div>

            <div className="grid sm:grid-cols-2 gap-4 border-t border-gray-100 pt-5">
              <div>
                <label className={label} htmlFor="tax-scheme">
                  Tax scheme
                </label>
                <select
                  id="tax-scheme"
                  className={input}
                  value={invoiceTax.tax_scheme}
                  onChange={(e) =>
                    setInvoiceTax((t) => ({
                      ...t,
                      tax_scheme: e.target.value as "gst" | "vat" | "none",
                    }))
                  }
                >
                  <option value="gst">GST (India)</option>
                  <option value="vat">VAT</option>
                  <option value="none">No tax label</option>
                </select>
              </div>
              <div>
                <label className={label} htmlFor="tax-label">
                  Label on invoice (e.g. GST, VAT)
                </label>
                <input
                  id="tax-label"
                  className={input}
                  maxLength={50}
                  value={invoiceTax.tax_label}
                  onChange={(e) => setInvoiceTax((t) => ({ ...t, tax_label: e.target.value }))}
                />
              </div>
              <div>
                <label className={label} htmlFor="tax-rate">
                  Default tax rate (%)
                </label>
                <input
                  id="tax-rate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  className={input}
                  placeholder="0"
                  value={invoiceTax.default_tax_rate_percent}
                  onChange={(e) => setInvoiceTax((t) => ({ ...t, default_tax_rate_percent: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={invoiceTax.prices_tax_inclusive}
                    onChange={(e) => setInvoiceTax((t) => ({ ...t, prices_tax_inclusive: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-800">Store prices include tax (inclusive)</span>
                </label>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 sm:col-span-2">Invoice numbering</h3>
              <div>
                <label className={label} htmlFor="inv-prefix">
                  Prefix (e.g. INV-)
                </label>
                <input
                  id="inv-prefix"
                  className={input}
                  maxLength={50}
                  placeholder="INV-"
                  value={invoiceTax.invoice_prefix}
                  onChange={(e) => setInvoiceTax((t) => ({ ...t, invoice_prefix: e.target.value }))}
                />
              </div>
              <div>
                <label className={label} htmlFor="inv-pad">
                  Number width (zero-padded digits)
                </label>
                <input
                  id="inv-pad"
                  type="number"
                  min={1}
                  max={12}
                  className={input}
                  value={invoiceTax.invoice_number_padding}
                  onChange={(e) => setInvoiceTax((t) => ({ ...t, invoice_number_padding: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1">Example: prefix INV- + width 4 → INV-0001</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900">PDF branding</h3>
              <div>
                <label className={label} htmlFor="pdf-company">
                  Legal / trading name on PDF
                </label>
                <input
                  id="pdf-company"
                  className={input}
                  maxLength={255}
                  placeholder="BlissFruitz Pvt Ltd"
                  value={invoiceTax.pdf_company_name}
                  onChange={(e) => setInvoiceTax((t) => ({ ...t, pdf_company_name: e.target.value }))}
                />
              </div>
              <div>
                <span className={label}>PDF logo</span>
                {invoiceTax.pdf_logo_url ? (
                  <p className="text-xs text-gray-500 mb-1 truncate">{invoiceTax.pdf_logo_url}</p>
                ) : null}
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 text-sm">
                  <Upload className="w-4 h-4" aria-hidden />
                  Upload logo
                  <input
                    id="settings-invoice-pdf-logo-file"
                    type="file"
                    accept="image/*"
                    title="Upload PDF logo image"
                    aria-label="Upload PDF logo image"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadInvoicePdfLogo(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer border-t border-gray-100 pt-4">
              <input
                type="checkbox"
                checked={invoiceTax.per_product_tax_enabled}
                onChange={(e) => setInvoiceTax((t) => ({ ...t, per_product_tax_enabled: e.target.checked }))}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-800">Per-product tax rates (when catalog supports it)</span>
            </label>

            <div className="space-y-4 border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900">Invoice Style Template</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: "classic", name: "Classic", desc: "Professional & standard" },
                  { id: "modern", name: "Modern", desc: "Clean with accent colors" },
                  { id: "minimal", name: "Minimal", desc: "Simple & compact" },
                ].map((tmpl) => (
                  <label
                    key={tmpl.id}
                    className={cn(
                      "cursor-pointer rounded-xl border p-4 transition-all hover:border-green-200",
                      invoiceTax.invoice_template === tmpl.id
                        ? "border-green-600 bg-green-50/50 ring-1 ring-green-600"
                        : "border-gray-200 bg-white"
                    )}
                  >
                    <input
                      type="radio"
                      name="invoice_template"
                      className="hidden"
                      checked={invoiceTax.invoice_template === tmpl.id}
                      onChange={() => setInvoiceTax((t) => ({ ...t, invoice_template: tmpl.id }))}
                    />
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-gray-900">{tmpl.name}</span>
                      <span className="text-xs text-gray-500">{tmpl.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 p-6 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Brand Preview</h4>
                <button
                  type="button"
                  onClick={() => generateInvoicePDF({
                    id: 0, order_number: "PREVIEW", total: 100, subtotal: 100, shipping_amount: 0,
                    shipping_name: "John Doe", shipping_phone: "9876543210", 
                    shipping_address: "123 Sample Lane", shipping_city: "City", shipping_state: "State", shipping_pincode: "123456",
                    items: [{ name: "Sample Product", quantity: 1, price: 100, total: 100 }]
                  }, {
                    tax_scheme: invoiceTax.tax_scheme,
                    tax_label: invoiceTax.tax_label,
                    prices_tax_inclusive: invoiceTax.per_product_tax_enabled,
                    pdf_company_name: invoiceTax.pdf_company_name,
                    pdf_logo_url: invoiceTax.pdf_logo_url,
                    invoice_template: invoiceTax.invoice_template
                  })}
                  className="flex items-center gap-1.5 text-xs font-bold text-green-600 hover:text-green-700"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview PDF
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center shrink-0">
                  <Receipt className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{invoiceTax.pdf_company_name || "Company Name"}</p>
                  <p className="text-xs text-gray-400">Template: <span className="capitalize">{invoiceTax.invoice_template}</span></p>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => save("invoice_tax")}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save invoice & tax"}
            </button>
          </div>
        )}
        {section === "coupons" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-900">Coupon defaults</h2>
            <p className="text-sm text-gray-500">
              Live coupon codes (create, edit, activate) are managed in{" "}
              <Link href="/admin/coupons" className="text-green-600 font-semibold hover:underline">
                Admin → Coupons
              </Link>
              . The mode below controls how the cart and checkout apply discounts.
            </p>
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-800">How customers apply coupons</p>
              {(
                [
                  {
                    value: "code_only" as const,
                    title: "Enter code only",
                    desc: "Customer types a coupon code and taps Apply (default).",
                  },
                  {
                    value: "select" as const,
                    title: "Choose from list",
                    desc: "Show a dropdown of eligible coupons on the cart; customer picks one.",
                  },
                  {
                    value: "auto" as const,
                    title: "Auto-apply best discount",
                    desc: "Apply the single best eligible coupon automatically (no code needed).",
                  },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-start gap-3 cursor-pointer rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50/80"
                >
                  <input
                    type="radio"
                    name="coupon_apply_mode"
                    className="mt-1 text-green-600 focus:ring-green-500"
                    checked={couponDefaults.coupon_apply_mode === opt.value}
                    onChange={() =>
                      setCouponDefaults((c) => ({ ...c, coupon_apply_mode: opt.value }))
                    }
                  />
                  <span>
                    <span className="text-sm font-medium text-gray-900">{opt.title}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">{opt.desc}</span>
                  </span>
                </label>
              ))}
            </div>
            <div>
              <label className={label} htmlFor="coupon-min-order">
                Minimum cart subtotal for auto-apply (₹, optional)
              </label>
              <input
                id="coupon-min-order"
                type="number"
                min={0}
                step={1}
                className={input}
                disabled={couponDefaults.coupon_apply_mode !== "auto"}
                placeholder="e.g. 300"
                value={couponDefaults.auto_apply_min_order}
                onChange={(e) => setCouponDefaults((c) => ({ ...c, auto_apply_min_order: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">
                Only used in <strong>Auto-apply best discount</strong> mode. Leave empty to allow auto-apply at any subtotal
                (each coupon&apos;s own minimum still applies).
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer border-t border-gray-100 pt-4">
              <input
                type="checkbox"
                checked={couponDefaults.user_specific_codes_enabled}
                onChange={(e) => setCouponDefaults((c) => ({ ...c, user_specific_codes_enabled: e.target.checked }))}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-800">Allow user-specific / single-use coupon codes (planned)</span>
            </label>
            <button
              type="button"
              disabled={saving}
              onClick={() => save("coupon_defaults")}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save coupon defaults"}
            </button>
          </div>
        )}
        {section === "api" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-900">API &amp; integrations</h2>
            <p className="text-sm text-gray-500">
              Preferences for upcoming REST access, outbound webhooks, and carrier APIs. Saving does not change catalog or orders
              today; workers and route handlers will read these values when those features ship.
            </p>
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-700">
              <strong className="text-gray-900">Secrets:</strong> API keys and tokens for Shiprocket, Delhivery, or a public REST
              key should live in <code className="bg-white px-1 rounded border">.env</code> in production — not in this database.
              This screen stores toggles and non-secret webhook endpoint URLs only.
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900">REST API</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={apiIntegrations.rest_api_enabled}
                  onChange={(e) => setApiIntegrations((x) => ({ ...x, rest_api_enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-800">Enable public REST API (when implemented)</span>
              </label>
              <p className="text-xs text-gray-500 pl-7">
                Key generation and scopes will be added in a later release; pair with env-based secrets for signing requests.
              </p>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900">Webhooks (ERP / CRM)</h3>
              <p className="text-xs text-gray-500">
                Optional outbound URLs your system will call for order &amp; inventory events (future). Use HTTPS in production.
              </p>
              <div>
                <label className={label} htmlFor="wh-erp">
                  ERP webhook URL
                </label>
                <input
                  id="wh-erp"
                  type="url"
                  className={input}
                  placeholder="https://erp.example.com/hooks/blissfruits"
                  value={apiIntegrations.webhook_erp_url}
                  onChange={(e) => setApiIntegrations((x) => ({ ...x, webhook_erp_url: e.target.value }))}
                />
              </div>
              <div>
                <label className={label} htmlFor="wh-crm">
                  CRM webhook URL
                </label>
                <input
                  id="wh-crm"
                  type="url"
                  className={input}
                  placeholder="https://crm.example.com/webhooks/orders"
                  value={apiIntegrations.webhook_crm_url}
                  onChange={(e) => setApiIntegrations((x) => ({ ...x, webhook_crm_url: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900">Shipping (Shiprocket)</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={apiIntegrations.shiprocket_enabled}
                  onChange={(e) => setApiIntegrations((x) => ({ ...x, shiprocket_enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-800">Enable Shiprocket integration (roadmap)</span>
              </label>
              <div>
                <label className={label} htmlFor="sr-wh">
                  Shiprocket webhook / callback URL (optional)
                </label>
                <input
                  id="sr-wh"
                  type="url"
                  className={input}
                  placeholder="https://yourdomain.com/api/integrations/shiprocket/webhook"
                  value={apiIntegrations.shiprocket_webhook_url}
                  onChange={(e) => setApiIntegrations((x) => ({ ...x, shiprocket_webhook_url: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900">Shipping (Delhivery)</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={apiIntegrations.delhivery_enabled}
                  onChange={(e) => setApiIntegrations((x) => ({ ...x, delhivery_enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-800">Enable Delhivery integration (roadmap)</span>
              </label>
              <div>
                <label className={label} htmlFor="dl-wh">
                  Delhivery webhook / callback URL (optional)
                </label>
                <input
                  id="dl-wh"
                  type="url"
                  className={input}
                  placeholder="https://yourdomain.com/api/integrations/delhivery/webhook"
                  value={apiIntegrations.delhivery_webhook_url}
                  onChange={(e) => setApiIntegrations((x) => ({ ...x, delhivery_webhook_url: e.target.value }))}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => save("api_integrations")}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save API & integrations"}
            </button>
          </div>
        )}
        {section === "backup" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Database (SQLite)</h2>
              <p className="text-sm text-gray-500">
                Export and restore apply to the SQLite file behind <code className="bg-gray-100 px-1 rounded">DATABASE_URL</code>{" "}
                (e.g. <code className="bg-gray-100 px-1 rounded">file:./dev.db</code>). Other databases are not supported here.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={exportBusy}
                  onClick={async () => {
                    setExportBusy(true);
                    try {
                      const { blob, filename } = await adminExportDatabase();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = filename;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("Backup download started");
                    } catch {
                      toast.error("Export failed (is DATABASE_URL a SQLite file?)");
                    } finally {
                      setExportBusy(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                >
                  {exportBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download database (.db)
                </button>
              </div>
              <div className="border border-amber-200 bg-amber-50/90 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-amber-950">Restore from backup</p>
                <p className="text-xs text-amber-900/90">
                  Replaces the live database file. A <code className="bg-white/80 px-1 rounded">.pre-restore-*.bak</code> copy is
                  created first. Close other apps using the DB if restore fails on Windows.
                </p>
                <div>
                  <label className={label} htmlFor="restore-file">
                    SQLite file
                  </label>
                  <input
                    id="restore-file"
                    type="file"
                    accept=".db,application/octet-stream,application/x-sqlite3"
                    className={`${input} py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-green-50 file:px-3 file:py-1 file:text-sm`}
                    onChange={(e) => {
                      setRestoreFile(e.target.files?.[0] ?? null);
                      setRestoreAck(false);
                    }}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-amber-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restoreAck}
                    onChange={(e) => setRestoreAck(e.target.checked)}
                    className="rounded border-amber-400 text-green-600 focus:ring-green-500"
                  />
                  I understand this will overwrite the current database.
                </label>
                <button
                  type="button"
                  disabled={restoreBusy || !restoreFile || !restoreAck}
                  onClick={async () => {
                    if (!restoreFile) return;
                    setRestoreBusy(true);
                    try {
                      const res = (await adminRestoreDatabase(restoreFile)) as {
                        data?: { message?: string };
                      };
                      toast.success(res.data?.message ?? "Database restored");
                      setRestoreFile(null);
                      setRestoreAck(false);
                    } catch (err: unknown) {
                      const msg =
                        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                      toast.error(msg ?? "Restore failed");
                    } finally {
                      setRestoreBusy(false);
                    }
                  }}
                  className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {restoreBusy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : null} Restore now
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Next.js build cache</h2>
              <p className="text-sm text-gray-500">
                Deletes the <code className="bg-gray-100 px-1 rounded">.next</code> folder (compiled output). In production this is
                blocked unless you set <code className="bg-gray-100 px-1 rounded">ALLOW_ADMIN_CACHE_CLEAR=true</code> in the environment.
              </p>
              <button
                type="button"
                disabled={clearBusy}
                onClick={async () => {
                  if (!window.confirm("Delete the .next cache folder? You will need to run dev or build again.")) return;
                  setClearBusy(true);
                  try {
                    const res = (await adminClearNextCache()) as { data?: { message?: string } };
                    toast.success(res.data?.message ?? "Cache cleared");
                  } catch (err: unknown) {
                    const msg =
                      (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                    toast.error(msg ?? "Could not clear cache");
                  } finally {
                    setClearBusy(false);
                  }
                }}
                className="inline-flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {clearBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Clear .next cache
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Scheduled backups (local & cloud)</h2>
              <p className="text-sm text-gray-500">
                Preferences for automation. A cron job or worker can read these later; enabling options here does not start backups by
                itself yet. Existing store data stays unchanged until a job runs.
              </p>
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-600">
                Local: copy the SQLite file on a schedule. Cloud: upload to S3, Google Cloud Storage, or Drive (integration
                planned).
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 sm:col-span-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={backup.scheduled_local_enabled}
                    onChange={(e) => setBackup((b) => ({ ...b, scheduled_local_enabled: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-800">Scheduled local database backups</span>
                </label>
                <div>
                  <label className={label} htmlFor="bk-freq">
                    Frequency
                  </label>
                  <select
                    id="bk-freq"
                    className={input}
                    disabled={!backup.scheduled_local_enabled}
                    value={backup.scheduled_local_frequency}
                    onChange={(e) =>
                      setBackup((b) => ({
                        ...b,
                        scheduled_local_frequency: e.target.value as "none" | "daily" | "weekly",
                      }))
                    }
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="bk-ret">
                    Keep copies (days)
                  </label>
                  <input
                    id="bk-ret"
                    type="number"
                    min={1}
                    max={365}
                    className={input}
                    disabled={!backup.scheduled_local_enabled}
                    value={backup.local_retention_days}
                    onChange={(e) =>
                      setBackup((b) => ({
                        ...b,
                        local_retention_days: Math.min(365, Math.max(1, Number(e.target.value) || 7)),
                      }))
                    }
                  />
                </div>
                <label className="flex items-center gap-3 sm:col-span-2 cursor-pointer border-t border-gray-100 pt-4">
                  <input
                    type="checkbox"
                    checked={backup.cloud_backup_enabled}
                    onChange={(e) => setBackup((b) => ({ ...b, cloud_backup_enabled: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-800">Scheduled cloud backups (when integration is available)</span>
                </label>
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="bk-cloud">
                    Cloud provider (planned)
                  </label>
                  <select
                    id="bk-cloud"
                    className={input}
                    disabled={!backup.cloud_backup_enabled}
                    value={backup.cloud_provider}
                    onChange={(e) =>
                      setBackup((b) => ({
                        ...b,
                        cloud_provider: e.target.value as "none" | "s3" | "gcs" | "gdrive",
                      }))
                    }
                  >
                    <option value="none">None selected</option>
                    <option value="s3">Amazon S3</option>
                    <option value="gcs">Google Cloud Storage</option>
                    <option value="gdrive">Google Drive</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => save("backup")}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save backup preferences"}
              </button>
            </div>
          </div>
        )}
        {section === "products" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Product catalogue defaults</h2>
            <p className="text-sm text-gray-500">
              Preferences for upcoming import and bulk-upload tools. Saving here does not change existing products;
              when CSV import and auto-SKU ship, they will read these values.
            </p>
            <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
              Inventory alerts and CSV upload are not enforced on the storefront yet — configuration is stored for the next release.
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={label} htmlFor="import-default-cat">
                  Default category for imports
                </label>
                <select
                  id="import-default-cat"
                  className={input}
                  value={productCatalog.default_import_category_id === null ? "" : String(productCatalog.default_import_category_id)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setProductCatalog((p) => ({
                      ...p,
                      default_import_category_id: v === "" ? null : Number(v),
                    }));
                  }}
                >
                  <option value="">None — choose per import when available</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 flex flex-col gap-3 border-t border-gray-100 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productCatalog.sku_auto_generate}
                    onChange={(e) => setProductCatalog((p) => ({ ...p, sku_auto_generate: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-800">SKU auto-generation for new products (import / create flows)</span>
                </label>
                <div>
                  <label className={label} htmlFor="sku-prefix">
                    SKU prefix
                  </label>
                  <input
                    id="sku-prefix"
                    className={input}
                    maxLength={50}
                    disabled={!productCatalog.sku_auto_generate}
                    placeholder="BF-"
                    value={productCatalog.sku_prefix}
                    onChange={(e) => setProductCatalog((p) => ({ ...p, sku_prefix: e.target.value }))}
                  />
                  <p className="text-xs text-gray-400 mt-1">Example: BF-1001 when auto-SKU is implemented.</p>
                </div>
              </div>
              <div className="sm:col-span-2 flex flex-col gap-3 border-t border-gray-100 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productCatalog.inventory_alerts_enabled}
                    onChange={(e) => setProductCatalog((p) => ({ ...p, inventory_alerts_enabled: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-800">Low-stock inventory alerts (email/dashboard — future)</span>
                </label>
                <div>
                  <label className={label} htmlFor="inv-threshold">
                    Low stock threshold (units)
                  </label>
                  <input
                    id="inv-threshold"
                    type="number"
                    min={0}
                    step={1}
                    className={input}
                    disabled={!productCatalog.inventory_alerts_enabled}
                    value={productCatalog.inventory_low_threshold}
                    onChange={(e) =>
                      setProductCatalog((p) => ({
                        ...p,
                        inventory_low_threshold: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="sm:col-span-2 border-t border-gray-100 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productCatalog.csv_bulk_upload_enabled}
                    onChange={(e) => setProductCatalog((p) => ({ ...p, csv_bulk_upload_enabled: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-800">Enable CSV bulk product upload (when the importer is released)</span>
                </label>
              </div>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => save("product_catalog")}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save catalogue defaults"}
            </button>
          </div>
        )}
        {section === "maintenance" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Maintenance mode</h2>
            <p className="text-sm text-gray-500">
              When enabled, visitors see your message instead of the shop. The admin panel and{" "}
              <strong className="text-gray-700">logged-in admin accounts</strong> can still use the storefront and{" "}
              <code className="bg-gray-100 px-1 rounded">/admin</code>.{" "}
              <code className="bg-gray-100 px-1 rounded">/login</code> stays open so admins can sign in. Customer accounts and
              orders in the database are not modified.
            </p>
            <div className="rounded-xl border border-green-100 bg-green-50/90 px-4 py-3 text-sm text-green-900">
              <strong className="font-semibold">API lock:</strong> <code className="bg-white/80 px-1 rounded">middleware.ts</code>{" "}
              returns HTTP 503 for storefront APIs when maintenance is on (non-admins).{" "}
              <code className="bg-white/80 px-1 rounded">/api/admin</code> and <code className="bg-white/80 px-1 rounded">/api/upload</code>{" "}
              are excluded so saving settings and the admin panel always work; those routes still require an admin session in code.
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={maintenance.enabled}
                onChange={(e) => setMaintenance((m) => ({ ...m, enabled: e.target.checked }))}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-800">Enable maintenance mode (close storefront)</span>
            </label>
            <div>
              <label className={label} htmlFor="maint-msg">
                Message for visitors
              </label>
              <textarea
                id="maint-msg"
                className={`${input} min-h-[120px]`}
                maxLength={2000}
                placeholder="We're upgrading our store. We'll be back shortly."
                value={maintenance.message}
                onChange={(e) => setMaintenance((m) => ({ ...m, message: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">Shown on the public site. Line breaks are preserved.</p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => save("maintenance")}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save maintenance settings"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
