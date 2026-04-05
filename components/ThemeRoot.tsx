"use client";

import { useEffect } from "react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { normalizeFacebookPixelId, normalizeGoogleAnalyticsId } from "@/lib/analytics";
import { darkenHex, normalizeHexColor } from "@/lib/theme";

function applyDarkClass(root: HTMLElement, mode: string) {
  const set = (dark: boolean) => {
    root.classList.toggle("dark", dark);
  };
  if (mode === "dark") {
    set(true);
    return;
  }
  if (mode === "light") {
    set(false);
    return;
  }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    set(true);
  } else {
    set(false);
  }
}

export default function ThemeRoot({ children }: { children: React.ReactNode }) {
  const { settings } = useSiteSettings();

  useEffect(() => {
    let mqCleanup: (() => void) | undefined;
    if (!settings) return;

    const s = settings;
    const a = s.analytics;
    if (a && typeof window !== "undefined") {
      const ga = normalizeGoogleAnalyticsId(String(a.google_analytics_id ?? ""));
      const fb = normalizeFacebookPixelId(String(a.facebook_pixel_id ?? ""));
      type BFAnalytics = {
        googleAnalyticsId: string | null;
        facebookPixelId: string | null;
        conversionTrackPurchase: boolean;
        conversionTrackAddToCart: boolean;
        conversionTrackBeginCheckout: boolean;
      };
      (window as Window & { __BF_ANALYTICS__?: BFAnalytics }).__BF_ANALYTICS__ = {
        googleAnalyticsId: ga,
        facebookPixelId: fb,
        conversionTrackPurchase: a.conversion_track_purchase !== false,
        conversionTrackAddToCart: a.conversion_track_add_to_cart !== false,
        conversionTrackBeginCheckout: a.conversion_track_begin_checkout !== false,
      };
      if (ga && !document.getElementById("bf-gtag-loader")) {
        const loader = document.createElement("script");
        loader.id = "bf-gtag-loader";
        loader.async = true;
        loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`;
        document.head.appendChild(loader);
        const inline = document.createElement("script");
        inline.id = "bf-gtag-inline";
        inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(ga)});`;
        document.head.appendChild(inline);
      }
      if (fb && !document.getElementById("bf-fbq-inline")) {
        const inline = document.createElement("script");
        inline.id = "bf-fbq-inline";
        inline.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(fb)});fbq('track','PageView');`;
        document.head.appendChild(inline);
      }
    }

    const root = document.documentElement;
    const t = s.theme;
    if (t) {
      const mode = String(t.theme_mode ?? "light").toLowerCase();
      applyDarkClass(root, mode);

      if (mode === "system" && typeof window !== "undefined") {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => applyDarkClass(root, "system");
        mq.addEventListener("change", onChange);
        mqCleanup = () => mq.removeEventListener("change", onChange);
      }

      const primary = normalizeHexColor(String(t.primary_color ?? "#16a34a"));
      root.style.setProperty("--color-primary", primary);
      root.style.setProperty("--color-primary-hover", darkenHex(primary, 0.14));
      root.classList.add("theme-custom-primary");

      document.body.setAttribute("data-layout", String(t.layout_preset ?? "default"));

      const css = typeof t.custom_css === "string" ? t.custom_css : "";
      let styleEl = document.getElementById("theme-custom-css");
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "theme-custom-css";
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = css;

      const oldScript = document.getElementById("theme-custom-js");
      oldScript?.remove();
      const js = typeof t.custom_js === "string" ? t.custom_js.trim() : "";
      if (js.length > 0) {
        try {
          const script = document.createElement("script");
          script.id = "theme-custom-js";
          script.textContent = js;
          document.body.appendChild(script);
        } catch (e) {
          console.error("theme custom_js failed to inject", e);
        }
      }
    }

    return () => {
      mqCleanup?.();
    };
  }, [settings]);

  return <>{children}</>;
}
