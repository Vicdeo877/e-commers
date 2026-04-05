import { prisma } from "@/lib/prisma";

export async function getShippingRates() {
  const s = await prisma.settingsShipping.findUnique({ where: { id: 1 } }).catch(() => null);
  return {
    flatRate: s?.flatRate ?? 50,
    freeShippingMin: s?.freeShippingMin ?? 500,
    deliveryEtaNote: s?.deliveryEtaNote ?? "Express: ~20 min – 2 hrs where available",
  };
}

export async function getPaymentFlags() {
  const p = await prisma.settingsPayment.findUnique({ where: { id: 1 } }).catch(() => null);
  return {
    currency: p?.currency ?? "INR",
    codEnabled: p?.codEnabled ?? true,
    razorpayEnabled: p?.razorpayEnabled ?? true,
    stripeEnabled: p?.stripeEnabled ?? false,
    paypalEnabled: p?.paypalEnabled ?? false,
  };
}

export async function getMaintenanceMode() {
  const row = await prisma.settingsMaintenance.findUnique({ where: { id: 1 } }).catch(() => null);
  return {
    enabled: row?.enabled ?? false,
    message:
      row?.message?.trim() ||
      "We're making improvements. Please check back soon.",
  };
}

/** Used by future CSV/import pipelines — does not alter existing rows alone */
export async function getProductCatalogDefaults() {
  const row = await prisma.settingsProductCatalog
    .findUnique({
      where: { id: 1 },
      include: { defaultImportCategory: { select: { id: true, slug: true, name: true } } },
    })
    .catch(() => null);
  return {
    defaultImportCategoryId: row?.defaultImportCategoryId ?? null,
    skuAutoGenerate: row?.skuAutoGenerate ?? false,
    skuPrefix: row?.skuPrefix ?? "BF-",
    inventoryAlertsEnabled: row?.inventoryAlertsEnabled ?? false,
    inventoryLowThreshold: row?.inventoryLowThreshold ?? 10,
    csvBulkUploadEnabled: row?.csvBulkUploadEnabled ?? false,
    defaultImportCategory: row?.defaultImportCategory ?? null,
  };
}

/** Future REST/webhooks/carrier workers — toggles & URLs only; API keys stay in env */
export async function getApiIntegrationsSettings() {
  const row = await prisma.settingsApiIntegrations.findUnique({ where: { id: 1 } }).catch(() => null);
  return {
    restApiEnabled: row?.restApiEnabled ?? false,
    webhookErpUrl: row?.webhookErpUrl ?? null,
    webhookCrmUrl: row?.webhookCrmUrl ?? null,
    shiprocketEnabled: row?.shiprocketEnabled ?? false,
    shiprocketWebhookUrl: row?.shiprocketWebhookUrl ?? null,
    delhiveryEnabled: row?.delhiveryEnabled ?? false,
    delhiveryWebhookUrl: row?.delhiveryWebhookUrl ?? null,
  };
}

export type CouponApplyMode = "auto" | "select" | "code_only";

/** Coupon UX: auto-apply best, pick from list, or type code only (see `couponApplyMode`). */
export async function getCouponDefaults() {
  const row = await prisma.settingsCouponDefaults.findUnique({ where: { id: 1 } }).catch(() => null);
  const raw = (row?.couponApplyMode ?? "code_only").toLowerCase();
  const couponApplyMode: CouponApplyMode =
    raw === "auto" || raw === "select" ? raw : "code_only";
  return {
    autoApplyEnabled: row?.autoApplyEnabled ?? false,
    couponApplyMode,
    autoApplyMinOrder: row?.autoApplyMinOrder ?? null,
    userSpecificCodesEnabled: row?.userSpecificCodesEnabled ?? false,
  };
}

/** Invoice / tax / PDF — used when PDF invoices and tax lines are implemented */
export async function getInvoiceTaxSettings() {
  const row = await prisma.settingsInvoiceTax.findUnique({ where: { id: 1 } }).catch(() => null);
  return {
    taxScheme: row?.taxScheme ?? "gst",
    taxLabel: row?.taxLabel ?? "GST",
    defaultTaxRatePercent: row?.defaultTaxRatePercent ?? 0,
    pricesTaxInclusive: row?.pricesTaxInclusive ?? false,
    invoicePrefix: row?.invoicePrefix ?? "INV-",
    invoiceNumberPadding: row?.invoiceNumberPadding ?? 4,
    pdfCompanyName: row?.pdfCompanyName ?? null,
    pdfLogoUrl: row?.pdfLogoUrl ?? null,
    perProductTaxEnabled: row?.perProductTaxEnabled ?? false,
    invoiceTemplate: row?.invoiceTemplate ?? "classic",
  };
}

export async function getUiThemeSettings() {
  const row = await prisma.settingsUiTheme.findUnique({ where: { id: 1 } }).catch(() => null);
  return {
    themeMode: row?.themeMode ?? "light",
    primaryColor: row?.primaryColor ?? "#16a34a",
    layoutPreset: row?.layoutPreset ?? "default",
    customCss: row?.customCss ?? null,
    customJs: row?.customJs ?? null,
  };
}

/** GA / Meta Pixel — public IDs; used by ThemeRoot via /api/content/site-settings */
export async function getAnalyticsSettings() {
  const row = await prisma.settingsAnalytics.findUnique({ where: { id: 1 } }).catch(() => null);
  return {
    googleAnalyticsId: row?.googleAnalyticsId ?? null,
    facebookPixelId: row?.facebookPixelId ?? null,
    conversionTrackPurchase: row?.conversionTrackPurchase ?? true,
    conversionTrackAddToCart: row?.conversionTrackAddToCart ?? true,
    conversionTrackBeginCheckout: row?.conversionTrackBeginCheckout ?? true,
  };
}

/** Admin login / session policy — used when auth, 2FA, and audit logging are enforced */
export async function getSecuritySettings() {
  const row = await prisma.settingsSecurity.findUnique({ where: { id: 1 } }).catch(() => null);
  return {
    adminTwoFactorEnabled: row?.adminTwoFactorEnabled ?? false,
    ipAllowlistEnabled: row?.ipAllowlistEnabled ?? false,
    ipAllowlistText: row?.ipAllowlistText ?? null,
    loginMaxAttempts: row?.loginMaxAttempts ?? 10,
    loginLockoutMinutes: row?.loginLockoutMinutes ?? 15,
    passwordMinLength: row?.passwordMinLength ?? 8,
    passwordRequireUpper: row?.passwordRequireUpper ?? false,
    passwordRequireLower: row?.passwordRequireLower ?? false,
    passwordRequireNumber: row?.passwordRequireNumber ?? false,
    passwordRequireSymbol: row?.passwordRequireSymbol ?? false,
    sessionTimeoutMinutes: row?.sessionTimeoutMinutes ?? 10080,
    auditLogEnabled: row?.auditLogEnabled ?? false,
    auditLogRetentionDays: row?.auditLogRetentionDays ?? 90,
  };
}

/** SMTP / SMS / push / templates — used when outbound mail, SMS, or workers are implemented */
export async function getEmailNotificationSettings() {
  const row = await prisma.settingsEmailNotifications.findUnique({ where: { id: 1 } }).catch(() => null);
  return {
    smtpEnabled: row?.smtpEnabled ?? false,
    smtpHost: row?.smtpHost ?? null,
    smtpPort: row?.smtpPort ?? 587,
    smtpTls: row?.smtpTls ?? true,
    smtpUser: row?.smtpUser ?? null,
    smtpPassword: row?.smtpPassword ?? null,
    smtpFromEmail: row?.smtpFromEmail ?? null,
    smtpFromName: row?.smtpFromName ?? null,
    smsProvider: row?.smsProvider ?? "none",
    twilioAccountSid: row?.twilioAccountSid ?? null,
    twilioAuthToken: row?.twilioAuthToken ?? null,
    twilioFromNumber: row?.twilioFromNumber ?? null,
    fast2smsApiKey: row?.fast2smsApiKey ?? null,
    fast2smsSenderId: row?.fast2smsSenderId ?? null,
    pushEnabled: row?.pushEnabled ?? false,
    pushProvider: row?.pushProvider ?? "none",
    fcmServerKey: row?.fcmServerKey ?? null,
    orderConfirmSubject: row?.orderConfirmSubject ?? null,
    orderConfirmBody: row?.orderConfirmBody ?? null,
    invoiceEmailSubject: row?.invoiceEmailSubject ?? null,
    invoiceEmailBody: row?.invoiceEmailBody ?? null,
    notifyOrderPlaced: row?.notifyOrderPlaced ?? true,
    notifyPaymentReceived: row?.notifyPaymentReceived ?? true,
    notifyShipped: row?.notifyShipped ?? true,
    eventQueueEnabled: row?.eventQueueEnabled ?? false,
  };
}
