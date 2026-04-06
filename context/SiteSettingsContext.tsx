"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getSiteSettings } from "@/lib/api";

/** Shape of GET /api/content/site-settings `data` payload */
export type PublicSiteSettings = {
  site_name: string;
  logo: string | null;
  favicon: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  timezone: string;
  language: string;
  payment: {
    currency: string;
    cod_enabled: boolean;
    razorpay_enabled: boolean;
    razorpay_key_id: string | null;
    stripe_enabled: boolean;
    paypal_enabled: boolean;
  };
  auth: {
    google_sign_in_enabled: boolean;
    google_client_id: string | null;
  };
  shipping: {
    flat_rate: number;
    free_shipping_min: number;
    delivery_eta_note: string;
  };
  theme: {
    theme_mode: string;
    primary_color: string;
    layout_preset: string;
    custom_css: string;
    custom_js: string;
  };
  analytics: {
    google_analytics_id: string;
    facebook_pixel_id: string;
    conversion_track_purchase: boolean;
    conversion_track_add_to_cart: boolean;
    conversion_track_begin_checkout: boolean;
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
  coupon?: {
    apply_mode: "auto" | "select" | "code_only";
    auto_apply_min_order: number | null;
  };
  invoice: {
    tax_scheme: string;
    tax_label: string;
    prices_tax_inclusive: boolean;
    pdf_company_name: string | null;
    pdf_logo_url: string | null;
    invoice_template: string;
  };
};

type Ctx = {
  settings: PublicSiteSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SiteSettingsContext = createContext<Ctx | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getSiteSettings();
      setSettings(s as PublicSiteSettings);
    } catch {
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  }
  return ctx;
}
