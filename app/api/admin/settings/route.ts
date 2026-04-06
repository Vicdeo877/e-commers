import { jsonOk, jsonErr } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { normalizeHexColor } from "@/lib/theme";
import { normalizeFacebookPixelId, normalizeGoogleAnalyticsId } from "@/lib/analytics";

/** Avoid failing the whole GET if one table is missing (DB not migrated) or a query errors */
async function safeRow<T>(label: string, fn: () => Promise<T | null>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    console.error(`[admin/settings GET] ${label}:`, e);
    return null;
  }
}

export async function GET() {
  try {
    await requireAdmin();
    const [g, p, s, pc, bk, mt, apiInt, cDef, inv, uiTh, em, sec, an] = await Promise.all([
      safeRow("settingsGeneral", () => prisma.settingsGeneral.findUnique({ where: { id: 1 } })),
      safeRow("settingsPayment", () => prisma.settingsPayment.findUnique({ where: { id: 1 } })),
      safeRow("settingsShipping", () => prisma.settingsShipping.findUnique({ where: { id: 1 } })),
      safeRow("settingsProductCatalog", () =>
        prisma.settingsProductCatalog.findUnique({
          where: { id: 1 },
          include: { defaultImportCategory: { select: { id: true, name: true, slug: true } } },
        })
      ),
      safeRow("settingsBackup", () => prisma.settingsBackup.findUnique({ where: { id: 1 } })),
      safeRow("settingsMaintenance", () => prisma.settingsMaintenance.findUnique({ where: { id: 1 } })),
      safeRow("settingsApiIntegrations", () => prisma.settingsApiIntegrations.findUnique({ where: { id: 1 } })),
      safeRow("settingsCouponDefaults", () => prisma.settingsCouponDefaults.findUnique({ where: { id: 1 } })),
      safeRow("settingsInvoiceTax", () => prisma.settingsInvoiceTax.findUnique({ where: { id: 1 } })),
      safeRow("settingsUiTheme", () => prisma.settingsUiTheme.findUnique({ where: { id: 1 } })),
      safeRow("settingsEmailNotifications", () => prisma.settingsEmailNotifications.findUnique({ where: { id: 1 } })),
      safeRow("settingsSecurity", () => prisma.settingsSecurity.findUnique({ where: { id: 1 } })),
      safeRow("settingsAnalytics", () => prisma.settingsAnalytics.findUnique({ where: { id: 1 } })),
    ]);

    return jsonOk({
      general: {
        site_name: g?.siteName ?? "BlissFruitz",
        logo: g?.logo ?? "",
        favicon: g?.favicon ?? "",
        email: g?.email ?? "",
        phone: g?.phone ?? "",
        address: g?.address ?? "",
        timezone: g?.timezone ?? "Asia/Kolkata",
        language: g?.language ?? "en",
      },
      payment: {
        currency: p?.currency ?? "INR",
        cod_enabled: p?.codEnabled ?? true,
        razorpay_enabled: p?.razorpayEnabled ?? true,
        stripe_enabled: p?.stripeEnabled ?? false,
        paypal_enabled: p?.paypalEnabled ?? false,
        auto_refund_enabled: p?.autoRefundEnabled ?? false,
        razorpay_webhook_url: p?.razorpayWebhookUrl ?? "",
        razorpay_key_id: p?.razorpayKeyId ?? "",
        razorpay_key_secret: "",
        razorpay_key_secret_set: Boolean(p?.razorpayKeySecret && p.razorpayKeySecret.length > 0),
      },
      shipping: {
        flat_rate: s?.flatRate ?? 50,
        free_shipping_min: s?.freeShippingMin ?? 500,
        delivery_eta_note: s?.deliveryEtaNote ?? "",
      },
      product_catalog: {
        default_import_category_id: pc?.defaultImportCategoryId ?? null,
        default_import_category: pc?.defaultImportCategory ?? null,
        sku_auto_generate: pc?.skuAutoGenerate ?? false,
        sku_prefix: pc?.skuPrefix ?? "BF-",
        inventory_alerts_enabled: pc?.inventoryAlertsEnabled ?? false,
        inventory_low_threshold: pc?.inventoryLowThreshold ?? 10,
        csv_bulk_upload_enabled: pc?.csvBulkUploadEnabled ?? false,
      },
      backup: {
        scheduled_local_enabled: bk?.scheduledLocalEnabled ?? false,
        scheduled_local_frequency: bk?.scheduledLocalFrequency ?? "none",
        local_retention_days: bk?.localRetentionDays ?? 7,
        cloud_backup_enabled: bk?.cloudBackupEnabled ?? false,
        cloud_provider: bk?.cloudProvider ?? "none",
      },
      maintenance: {
        enabled: mt?.enabled ?? false,
        message:
          mt?.message?.trim() ||
          "We're making improvements. Please check back soon.",
      },
      api_integrations: {
        rest_api_enabled: apiInt?.restApiEnabled ?? false,
        webhook_erp_url: apiInt?.webhookErpUrl ?? "",
        webhook_crm_url: apiInt?.webhookCrmUrl ?? "",
        shiprocket_enabled: apiInt?.shiprocketEnabled ?? false,
        shiprocket_webhook_url: apiInt?.shiprocketWebhookUrl ?? "",
        delhivery_enabled: apiInt?.delhiveryEnabled ?? false,
        delhivery_webhook_url: apiInt?.delhiveryWebhookUrl ?? "",
      },
      coupon_defaults: {
        auto_apply_enabled: cDef?.autoApplyEnabled ?? false,
        coupon_apply_mode: (() => {
          const m = String(cDef?.couponApplyMode ?? "").toLowerCase();
          if (m === "auto" || m === "select") return m;
          return cDef?.autoApplyEnabled ? "auto" : "code_only";
        })(),
        auto_apply_min_order: cDef?.autoApplyMinOrder ?? null,
        user_specific_codes_enabled: cDef?.userSpecificCodesEnabled ?? false,
      },
      invoice_tax: {
        tax_scheme: inv?.taxScheme ?? "gst",
        tax_label: inv?.taxLabel ?? "GST",
        default_tax_rate_percent: inv?.defaultTaxRatePercent ?? 0,
        prices_tax_inclusive: inv?.pricesTaxInclusive ?? false,
        invoice_prefix: inv?.invoicePrefix ?? "INV-",
        invoice_number_padding: inv?.invoiceNumberPadding ?? 4,
        pdf_company_name: inv?.pdfCompanyName ?? "",
        pdf_logo_url: inv?.pdfLogoUrl ?? "",
        per_product_tax_enabled: inv?.perProductTaxEnabled ?? false,
        invoice_template: inv?.invoiceTemplate ?? "classic",
      },
      ui_theme: {
        theme_mode: uiTh?.themeMode ?? "light",
        primary_color: uiTh?.primaryColor ?? "#16a34a",
        layout_preset: uiTh?.layoutPreset ?? "default",
        custom_css: uiTh?.customCss ?? "",
        custom_js: uiTh?.customJs ?? "",
      },
      email_notifications: {
        smtp_enabled: em?.smtpEnabled ?? false,
        smtp_host: em?.smtpHost ?? "",
        smtp_port: em?.smtpPort ?? 587,
        smtp_tls: em?.smtpTls ?? true,
        smtp_user: em?.smtpUser ?? "",
        smtp_password: "",
        smtp_password_set: Boolean(em?.smtpPassword && em.smtpPassword.length > 0),
        smtp_from_email: em?.smtpFromEmail ?? "",
        smtp_from_name: em?.smtpFromName ?? "",
        sms_provider: em?.smsProvider ?? "none",
        twilio_account_sid: em?.twilioAccountSid ?? "",
        twilio_auth_token: "",
        twilio_auth_token_set: Boolean(em?.twilioAuthToken && em.twilioAuthToken.length > 0),
        twilio_from_number: em?.twilioFromNumber ?? "",
        fast2sms_api_key: "",
        fast2sms_api_key_set: Boolean(em?.fast2smsApiKey && em.fast2smsApiKey.length > 0),
        fast2sms_sender_id: em?.fast2smsSenderId ?? "",
        push_enabled: em?.pushEnabled ?? false,
        push_provider: em?.pushProvider ?? "none",
        fcm_server_key: "",
        fcm_server_key_set: Boolean(em?.fcmServerKey && em.fcmServerKey.length > 0),
        order_confirm_subject: em?.orderConfirmSubject ?? "",
        order_confirm_body: em?.orderConfirmBody ?? "",
        invoice_email_subject: em?.invoiceEmailSubject ?? "",
        invoice_email_body: em?.invoiceEmailBody ?? "",
        notify_order_placed: em?.notifyOrderPlaced ?? true,
        notify_payment_received: em?.notifyPaymentReceived ?? true,
        notify_shipped: em?.notifyShipped ?? true,
        event_queue_enabled: em?.eventQueueEnabled ?? false,
      },
      security: {
        admin_two_factor_enabled: sec?.adminTwoFactorEnabled ?? false,
        google_sign_in_enabled: sec?.googleSignInEnabled ?? false,
        google_client_id: sec?.googleClientId ?? "",
        google_client_secret: "",
        google_client_secret_set: Boolean(sec?.googleClientSecret && sec.googleClientSecret.length > 0),
        ip_allowlist_enabled: sec?.ipAllowlistEnabled ?? false,
        ip_allowlist_text: sec?.ipAllowlistText ?? "",
        login_max_attempts: sec?.loginMaxAttempts ?? 10,
        login_lockout_minutes: sec?.loginLockoutMinutes ?? 15,
        password_min_length: sec?.passwordMinLength ?? 8,
        password_require_upper: sec?.passwordRequireUpper ?? false,
        password_require_lower: sec?.passwordRequireLower ?? false,
        password_require_number: sec?.passwordRequireNumber ?? false,
        password_require_symbol: sec?.passwordRequireSymbol ?? false,
        session_timeout_minutes: sec?.sessionTimeoutMinutes ?? 10080,
        audit_log_enabled: sec?.auditLogEnabled ?? false,
        audit_log_retention_days: sec?.auditLogRetentionDays ?? 90,
      },
      analytics: {
        google_analytics_id: an?.googleAnalyticsId ?? "",
        facebook_pixel_id: an?.facebookPixelId ?? "",
        conversion_track_purchase: an?.conversionTrackPurchase ?? true,
        conversion_track_add_to_cart: an?.conversionTrackAddToCart ?? true,
        conversion_track_begin_checkout: an?.conversionTrackBeginCheckout ?? true,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to load settings", 500);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();

    if (body.general && typeof body.general === "object") {
      const g = body.general;
      await prisma.settingsGeneral.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          siteName: String(g.site_name ?? "BlissFruitz").slice(0, 255),
          logo: g.logo != null ? String(g.logo).slice(0, 500) : null,
          favicon: g.favicon != null ? String(g.favicon).slice(0, 500) : null,
          email: g.email != null ? String(g.email).slice(0, 255) : null,
          phone: g.phone != null ? String(g.phone).slice(0, 50) : null,
          address: g.address != null ? String(g.address).slice(0, 1000) : null,
          timezone: String(g.timezone ?? "Asia/Kolkata").slice(0, 50),
          language: String(g.language ?? "en").slice(0, 20),
        },
        update: {
          siteName: String(g.site_name ?? "BlissFruitz").slice(0, 255),
          logo: g.logo != null ? String(g.logo).slice(0, 500) : null,
          favicon: g.favicon != null ? String(g.favicon).slice(0, 500) : null,
          email: g.email != null ? String(g.email).slice(0, 255) : null,
          phone: g.phone != null ? String(g.phone).slice(0, 50) : null,
          address: g.address != null ? String(g.address).slice(0, 1000) : null,
          timezone: String(g.timezone ?? "Asia/Kolkata").slice(0, 50),
          language: String(g.language ?? "en").slice(0, 20),
        },
      });
    }

    if (body.payment && typeof body.payment === "object") {
      const p = body.payment;
      await prisma.settingsPayment.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          currency: String(p.currency ?? "INR").slice(0, 10).toUpperCase(),
          codEnabled: Boolean(p.cod_enabled),
          razorpayEnabled: Boolean(p.razorpay_enabled),
          stripeEnabled: Boolean(p.stripe_enabled),
          paypalEnabled: Boolean(p.paypal_enabled),
          autoRefundEnabled: Boolean(p.auto_refund_enabled),
          razorpayWebhookUrl: p.razorpay_webhook_url
            ? String(p.razorpay_webhook_url).slice(0, 2000)
            : null,
          razorpayKeyId: p.razorpay_key_id ? String(p.razorpay_key_id).slice(0, 255) : null,
          razorpayKeySecret: p.razorpay_key_secret ? String(p.razorpay_key_secret).slice(0, 500) : null,
        },
        update: {
          currency: String(p.currency ?? "INR").slice(0, 10).toUpperCase(),
          codEnabled: Boolean(p.cod_enabled),
          razorpayEnabled: Boolean(p.razorpay_enabled),
          stripeEnabled: Boolean(p.stripe_enabled),
          paypalEnabled: Boolean(p.paypal_enabled),
          autoRefundEnabled: Boolean(p.auto_refund_enabled),
          razorpayWebhookUrl: p.razorpay_webhook_url
            ? String(p.razorpay_webhook_url).slice(0, 2000)
            : null,
          razorpayKeyId: p.razorpay_key_id ? String(p.razorpay_key_id).slice(0, 255) : null,
          ...(p.razorpay_key_secret ? { razorpayKeySecret: String(p.razorpay_key_secret).slice(0, 500) } : {}),
          ...(p.clear_razorpay_key_secret ? { razorpayKeySecret: null } : {}),
        },
      });
    }

    if (body.shipping && typeof body.shipping === "object") {
      const s = body.shipping;
      const flat = Number(s.flat_rate);
      const freeMin = Number(s.free_shipping_min);
      await prisma.settingsShipping.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          flatRate: Number.isFinite(flat) && flat >= 0 ? flat : 50,
          freeShippingMin: Number.isFinite(freeMin) && freeMin >= 0 ? freeMin : 500,
          deliveryEtaNote: s.delivery_eta_note != null ? String(s.delivery_eta_note).slice(0, 500) : null,
        },
        update: {
          flatRate: Number.isFinite(flat) && flat >= 0 ? flat : 50,
          freeShippingMin: Number.isFinite(freeMin) && freeMin >= 0 ? freeMin : 500,
          deliveryEtaNote: s.delivery_eta_note != null ? String(s.delivery_eta_note).slice(0, 500) : null,
        },
      });
    }

    if (body.product_catalog && typeof body.product_catalog === "object") {
      const c = body.product_catalog as Record<string, unknown>;
      let catId: number | null = null;
      if (c.default_import_category_id === null || c.default_import_category_id === "") {
        catId = null;
      } else {
        const n = Number(c.default_import_category_id);
        if (Number.isFinite(n) && n > 0) {
          const exists = await prisma.category.findUnique({ where: { id: n } });
          catId = exists ? n : null;
        }
      }
      const low = Number(c.inventory_low_threshold);
      await prisma.settingsProductCatalog.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          defaultImportCategoryId: catId,
          skuAutoGenerate: Boolean(c.sku_auto_generate),
          skuPrefix: String(c.sku_prefix ?? "BF-").slice(0, 50) || "BF-",
          inventoryAlertsEnabled: Boolean(c.inventory_alerts_enabled),
          inventoryLowThreshold:
            Number.isFinite(low) && low >= 0 && low <= 999_999 ? Math.floor(low) : 10,
          csvBulkUploadEnabled: Boolean(c.csv_bulk_upload_enabled),
        },
        update: {
          defaultImportCategoryId: catId,
          skuAutoGenerate: Boolean(c.sku_auto_generate),
          skuPrefix: String(c.sku_prefix ?? "BF-").slice(0, 50) || "BF-",
          inventoryAlertsEnabled: Boolean(c.inventory_alerts_enabled),
          inventoryLowThreshold:
            Number.isFinite(low) && low >= 0 && low <= 999_999 ? Math.floor(low) : 10,
          csvBulkUploadEnabled: Boolean(c.csv_bulk_upload_enabled),
        },
      });
    }

    if (body.backup && typeof body.backup === "object") {
      const b = body.backup as Record<string, unknown>;
      const freqRaw = String(b.scheduled_local_frequency ?? "none").toLowerCase();
      const freq = ["none", "daily", "weekly"].includes(freqRaw) ? freqRaw : "none";
      const provRaw = String(b.cloud_provider ?? "none").toLowerCase();
      const prov = ["none", "s3", "gcs", "gdrive"].includes(provRaw) ? provRaw : "none";
      const ret = Number(b.local_retention_days);
      await prisma.settingsBackup.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          scheduledLocalEnabled: Boolean(b.scheduled_local_enabled),
          scheduledLocalFrequency: freq,
          localRetentionDays:
            Number.isFinite(ret) && ret >= 1 && ret <= 365 ? Math.floor(ret) : 7,
          cloudBackupEnabled: Boolean(b.cloud_backup_enabled),
          cloudProvider: prov,
        },
        update: {
          scheduledLocalEnabled: Boolean(b.scheduled_local_enabled),
          scheduledLocalFrequency: freq,
          localRetentionDays:
            Number.isFinite(ret) && ret >= 1 && ret <= 365 ? Math.floor(ret) : 7,
          cloudBackupEnabled: Boolean(b.cloud_backup_enabled),
          cloudProvider: prov,
        },
      });
    }

    if (body.maintenance && typeof body.maintenance === "object") {
      const m = body.maintenance as Record<string, unknown>;
      const raw = String(m.message ?? "").trim().slice(0, 2000);
      const msg =
        raw.length > 0
          ? raw
          : "We're making improvements. Please check back soon.";
      await prisma.settingsMaintenance.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          enabled: Boolean(m.enabled),
          message: msg,
        },
        update: {
          enabled: Boolean(m.enabled),
          message: msg,
        },
      });
    }

    if (body.api_integrations && typeof body.api_integrations === "object") {
      const a = body.api_integrations as Record<string, unknown>;
      const url = (k: string) => {
        const v = a[k];
        if (v == null || v === "") return null;
        return String(v).trim().slice(0, 2000) || null;
      };
      await prisma.settingsApiIntegrations.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          restApiEnabled: Boolean(a.rest_api_enabled),
          webhookErpUrl: url("webhook_erp_url"),
          webhookCrmUrl: url("webhook_crm_url"),
          shiprocketEnabled: Boolean(a.shiprocket_enabled),
          shiprocketWebhookUrl: url("shiprocket_webhook_url"),
          delhiveryEnabled: Boolean(a.delhivery_enabled),
          delhiveryWebhookUrl: url("delhivery_webhook_url"),
        },
        update: {
          restApiEnabled: Boolean(a.rest_api_enabled),
          webhookErpUrl: url("webhook_erp_url"),
          webhookCrmUrl: url("webhook_crm_url"),
          shiprocketEnabled: Boolean(a.shiprocket_enabled),
          shiprocketWebhookUrl: url("shiprocket_webhook_url"),
          delhiveryEnabled: Boolean(a.delhivery_enabled),
          delhiveryWebhookUrl: url("delhivery_webhook_url"),
        },
      });
    }

    if (body.coupon_defaults && typeof body.coupon_defaults === "object") {
      const c = body.coupon_defaults as Record<string, unknown>;
      const rawMin = c.auto_apply_min_order;
      let minOrder: number | null = null;
      if (rawMin !== null && rawMin !== undefined && rawMin !== "") {
        const n = Number(rawMin);
        if (Number.isFinite(n) && n >= 0) minOrder = n;
      }
      const rawMode = String(c.coupon_apply_mode ?? "").toLowerCase();
      const couponApplyMode =
        rawMode === "auto" || rawMode === "select" ? rawMode : "code_only";
      const autoApplyEnabled = couponApplyMode === "auto";
      await prisma.settingsCouponDefaults.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          autoApplyEnabled,
          couponApplyMode,
          autoApplyMinOrder: minOrder,
          userSpecificCodesEnabled: Boolean(c.user_specific_codes_enabled),
        },
        update: {
          autoApplyEnabled,
          couponApplyMode,
          autoApplyMinOrder: minOrder,
          userSpecificCodesEnabled: Boolean(c.user_specific_codes_enabled),
        },
      });
    }

    if (body.invoice_tax && typeof body.invoice_tax === "object") {
      const x = body.invoice_tax as Record<string, unknown>;
      const schemeRaw = String(x.tax_scheme ?? "gst").toLowerCase();
      const scheme = ["gst", "vat", "none"].includes(schemeRaw) ? schemeRaw : "gst";
      const rate = Number(x.default_tax_rate_percent);
      const pad = Number(x.invoice_number_padding);
      const pdfName = x.pdf_company_name != null ? String(x.pdf_company_name).trim().slice(0, 255) : null;
      const pdfLogo = x.pdf_logo_url != null ? String(x.pdf_logo_url).trim().slice(0, 500) : null;
      await prisma.settingsInvoiceTax.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          taxScheme: scheme,
          taxLabel: String(x.tax_label ?? "GST").trim().slice(0, 50) || "GST",
          defaultTaxRatePercent:
            Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : 0,
          pricesTaxInclusive: Boolean(x.prices_tax_inclusive),
          invoicePrefix: String(x.invoice_prefix ?? "INV-").trim().slice(0, 50) || "INV-",
          invoiceNumberPadding:
            Number.isFinite(pad) && pad >= 1 && pad <= 12 ? Math.floor(pad) : 4,
          pdfCompanyName: pdfName && pdfName.length > 0 ? pdfName : null,
          pdfLogoUrl: pdfLogo && pdfLogo.length > 0 ? pdfLogo : null,
          perProductTaxEnabled: Boolean(x.per_product_tax_enabled),
          invoiceTemplate: String(x.invoice_template ?? "classic").slice(0, 50),
        },
        update: {
          taxScheme: scheme,
          taxLabel: String(x.tax_label ?? "GST").trim().slice(0, 50) || "GST",
          defaultTaxRatePercent:
            Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : 0,
          pricesTaxInclusive: Boolean(x.prices_tax_inclusive),
          invoicePrefix: String(x.invoice_prefix ?? "INV-").trim().slice(0, 50) || "INV-",
          invoiceNumberPadding:
            Number.isFinite(pad) && pad >= 1 && pad <= 12 ? Math.floor(pad) : 4,
          pdfCompanyName: pdfName && pdfName.length > 0 ? pdfName : null,
          pdfLogoUrl: pdfLogo && pdfLogo.length > 0 ? pdfLogo : null,
          perProductTaxEnabled: Boolean(x.per_product_tax_enabled),
          invoiceTemplate: String(x.invoice_template ?? "classic").slice(0, 50),
        },
      });
    }

    if (body.ui_theme && typeof body.ui_theme === "object") {
      const u = body.ui_theme as Record<string, unknown>;
      const modeRaw = String(u.theme_mode ?? "light").toLowerCase();
      const mode = ["light", "dark", "system"].includes(modeRaw) ? modeRaw : "light";
      const layoutRaw = String(u.layout_preset ?? "default").toLowerCase();
      const layout = ["default", "compact", "wide"].includes(layoutRaw) ? layoutRaw : "default";
      const primary = normalizeHexColor(String(u.primary_color ?? "#16a34a"));
      const cssRaw = u.custom_css != null ? String(u.custom_css) : "";
      const jsRaw = u.custom_js != null ? String(u.custom_js) : "";
      const customCss = cssRaw.length > 32_000 ? cssRaw.slice(0, 32_000) : cssRaw;
      const customJs = jsRaw.length > 32_000 ? jsRaw.slice(0, 32_000) : jsRaw;
      await prisma.settingsUiTheme.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          themeMode: mode,
          primaryColor: primary,
          layoutPreset: layout,
          customCss: customCss.length > 0 ? customCss : null,
          customJs: customJs.length > 0 ? customJs : null,
        },
        update: {
          themeMode: mode,
          primaryColor: primary,
          layoutPreset: layout,
          customCss: customCss.length > 0 ? customCss : null,
          customJs: customJs.length > 0 ? customJs : null,
        },
      });
    }

    if (body.email_notifications && typeof body.email_notifications === "object") {
      const u = body.email_notifications as Record<string, unknown>;
      const LONG = 32_000;
      const str = (k: string, max: number) => {
        const v = u[k];
        if (v == null) return null;
        const s = String(v);
        return s.length > max ? s.slice(0, max) : s;
      };
      const smsRaw = String(u.sms_provider ?? "none").toLowerCase();
      const smsProvider = ["none", "twilio", "fast2sms"].includes(smsRaw) ? smsRaw : "none";
      const pushRaw = String(u.push_provider ?? "none").toLowerCase();
      const pushProvider = ["none", "fcm"].includes(pushRaw) ? pushRaw : "none";
      const port = Number(u.smtp_port);
      const smtpPort = Number.isFinite(port) && port >= 1 && port <= 65535 ? Math.floor(port) : 587;

      const applySecret = (key: string, clearKey: string, max: number): string | null | undefined => {
        if (u[clearKey] === true) return null;
        const raw = u[key];
        if (typeof raw !== "string" || raw.length === 0) return undefined;
        return raw.slice(0, max);
      };

      const smtpPwd = applySecret("smtp_password", "clear_smtp_password", 500);
      const twilioTok = applySecret("twilio_auth_token", "clear_twilio_auth_token", 500);
      const fastKey = applySecret("fast2sms_api_key", "clear_fast2sms_api_key", 500);
      const fcmKey = applySecret("fcm_server_key", "clear_fcm_server_key", 2000);

      const base = {
        smtpEnabled: Boolean(u.smtp_enabled),
        smtpHost: str("smtp_host", 255),
        smtpPort,
        smtpTls: Boolean(u.smtp_tls),
        smtpUser: str("smtp_user", 255),
        smtpFromEmail: str("smtp_from_email", 255),
        smtpFromName: str("smtp_from_name", 255),
        smsProvider,
        twilioAccountSid: str("twilio_account_sid", 255),
        twilioFromNumber: str("twilio_from_number", 50),
        fast2smsSenderId: str("fast2sms_sender_id", 50),
        pushEnabled: Boolean(u.push_enabled),
        pushProvider,
        orderConfirmSubject: str("order_confirm_subject", 500),
        orderConfirmBody: str("order_confirm_body", LONG),
        invoiceEmailSubject: str("invoice_email_subject", 500),
        invoiceEmailBody: str("invoice_email_body", LONG),
        notifyOrderPlaced: Boolean(u.notify_order_placed),
        notifyPaymentReceived: Boolean(u.notify_payment_received),
        notifyShipped: Boolean(u.notify_shipped),
        eventQueueEnabled: Boolean(u.event_queue_enabled),
      };

      await prisma.settingsEmailNotifications.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          ...base,
          smtpPassword: smtpPwd === undefined ? null : smtpPwd,
          twilioAuthToken: twilioTok === undefined ? null : twilioTok,
          fast2smsApiKey: fastKey === undefined ? null : fastKey,
          fcmServerKey: fcmKey === undefined ? null : fcmKey,
        },
        update: {
          ...base,
          ...(smtpPwd !== undefined ? { smtpPassword: smtpPwd } : {}),
          ...(twilioTok !== undefined ? { twilioAuthToken: twilioTok } : {}),
          ...(fastKey !== undefined ? { fast2smsApiKey: fastKey } : {}),
          ...(fcmKey !== undefined ? { fcmServerKey: fcmKey } : {}),
        },
      });
    }

    if (body.security && typeof body.security === "object") {
      const u = body.security as Record<string, unknown>;
      const attempts = Number(u.login_max_attempts);
      const lockMin = Number(u.login_lockout_minutes);
      const pwdLen = Number(u.password_min_length);
      const sessMin = Number(u.session_timeout_minutes);
      const auditDays = Number(u.audit_log_retention_days);
      const ipTextRaw = u.ip_allowlist_text != null ? String(u.ip_allowlist_text) : "";
      const ipText = ipTextRaw.length > 8000 ? ipTextRaw.slice(0, 8000) : ipTextRaw;

      const loginMaxAttempts =
        Number.isFinite(attempts) && attempts >= 1 && attempts <= 100 ? Math.floor(attempts) : 10;
      const loginLockoutMinutes =
        Number.isFinite(lockMin) && lockMin >= 1 && lockMin <= 1440 ? Math.floor(lockMin) : 15;
      const passwordMinLength =
        Number.isFinite(pwdLen) && pwdLen >= 6 && pwdLen <= 128 ? Math.floor(pwdLen) : 8;
      const sessionTimeoutMinutes =
        Number.isFinite(sessMin) && sessMin >= 5 && sessMin <= 525600 ? Math.floor(sessMin) : 10080;
      const auditLogRetentionDays =
        Number.isFinite(auditDays) && auditDays >= 1 && auditDays <= 3650
          ? Math.floor(auditDays)
          : 90;

      await prisma.settingsSecurity.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          adminTwoFactorEnabled: Boolean(u.admin_two_factor_enabled),
          googleSignInEnabled: Boolean(u.google_sign_in_enabled),
          googleClientId: u.google_client_id ? String(u.google_client_id).slice(0, 255) : null,
          googleClientSecret: u.google_client_secret ? String(u.google_client_secret).slice(0, 500) : null,
          ipAllowlistEnabled: Boolean(u.ip_allowlist_enabled),
          ipAllowlistText: ipText.length > 0 ? ipText : null,
          loginMaxAttempts,
          loginLockoutMinutes,
          passwordMinLength,
          passwordRequireUpper: Boolean(u.password_require_upper),
          passwordRequireLower: Boolean(u.password_require_lower),
          passwordRequireNumber: Boolean(u.password_require_number),
          passwordRequireSymbol: Boolean(u.password_require_symbol),
          sessionTimeoutMinutes,
          auditLogEnabled: Boolean(u.audit_log_enabled),
          auditLogRetentionDays,
        },
        update: {
          adminTwoFactorEnabled: Boolean(u.admin_two_factor_enabled),
          googleSignInEnabled: Boolean(u.google_sign_in_enabled),
          googleClientId: u.google_client_id ? String(u.google_client_id).slice(0, 255) : null,
          ...(u.google_client_secret ? { googleClientSecret: String(u.google_client_secret).slice(0, 500) } : {}),
          ...(u.clear_google_client_secret ? { googleClientSecret: null } : {}),
          ipAllowlistEnabled: Boolean(u.ip_allowlist_enabled),
          ipAllowlistText: ipText.length > 0 ? ipText : null,
          loginMaxAttempts,
          loginLockoutMinutes,
          passwordMinLength,
          passwordRequireUpper: Boolean(u.password_require_upper),
          passwordRequireLower: Boolean(u.password_require_lower),
          passwordRequireNumber: Boolean(u.password_require_number),
          passwordRequireSymbol: Boolean(u.password_require_symbol),
          sessionTimeoutMinutes,
          auditLogEnabled: Boolean(u.audit_log_enabled),
          auditLogRetentionDays,
        },
      });
    }

    if (body.analytics && typeof body.analytics === "object") {
      const u = body.analytics as Record<string, unknown>;
      const ga = normalizeGoogleAnalyticsId(u.google_analytics_id);
      const fb = normalizeFacebookPixelId(u.facebook_pixel_id);
      await prisma.settingsAnalytics.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          googleAnalyticsId: ga,
          facebookPixelId: fb,
          conversionTrackPurchase: u.conversion_track_purchase !== false,
          conversionTrackAddToCart: u.conversion_track_add_to_cart !== false,
          conversionTrackBeginCheckout: u.conversion_track_begin_checkout !== false,
        },
        update: {
          googleAnalyticsId: ga,
          facebookPixelId: fb,
          conversionTrackPurchase: u.conversion_track_purchase !== false,
          conversionTrackAddToCart: u.conversion_track_add_to_cart !== false,
          conversionTrackBeginCheckout: u.conversion_track_begin_checkout !== false,
        },
      });
    }

    return jsonOk({ message: "Saved" });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonErr("Forbidden", 403);
    console.error(e);
    return jsonErr("Failed to save settings", 500);
  }
}
