/**
 * gtag / fbq e-commerce helpers — respect Admin → Analytics conversion toggles via window.__BF_ANALYTICS__
 */

type BFAnalytics = {
  googleAnalyticsId: string | null;
  facebookPixelId: string | null;
  conversionTrackPurchase: boolean;
  conversionTrackAddToCart: boolean;
  conversionTrackBeginCheckout: boolean;
};

function cfg(): BFAnalytics | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { __BF_ANALYTICS__?: BFAnalytics }).__BF_ANALYTICS__;
}

export function trackAddToCartEcommerce(params: {
  currency: string;
  value: number;
  productId: number;
  productName: string;
  quantity: number;
}) {
  const c = cfg();
  if (!c?.conversionTrackAddToCart) return;
  const gtag = (window as Window & { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    gtag("event", "add_to_cart", {
      currency: params.currency,
      value: params.value,
      items: [
        {
          item_id: String(params.productId),
          item_name: params.productName,
          quantity: params.quantity,
          price: params.value / Math.max(1, params.quantity),
        },
      ],
    });
  }
  const fbq = (window as Window & { fbq?: (...a: unknown[]) => void }).fbq;
  if (typeof fbq === "function") {
    fbq("track", "AddToCart", {
      value: params.value,
      currency: params.currency,
      content_ids: [String(params.productId)],
      content_type: "product",
      content_name: params.productName,
    });
  }
}

export function trackBeginCheckoutEcommerce(params: {
  currency: string;
  value: number;
  items: { id: number; name: string; quantity: number; price: number }[];
}) {
  const c = cfg();
  if (!c?.conversionTrackBeginCheckout) return;
  const gtag = (window as Window & { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    gtag("event", "begin_checkout", {
      currency: params.currency,
      value: params.value,
      items: params.items.map((i) => ({
        item_id: String(i.id),
        item_name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
    });
  }
  const fbq = (window as Window & { fbq?: (...a: unknown[]) => void }).fbq;
  if (typeof fbq === "function") {
    fbq("track", "InitiateCheckout", {
      value: params.value,
      currency: params.currency,
      content_ids: params.items.map((i) => String(i.id)),
      content_type: "product",
    });
  }
}

export function trackPurchaseEcommerce(params: {
  currency: string;
  value: number;
  transactionId: string;
  items: { id: number; name: string; quantity: number; price: number }[];
}) {
  const c = cfg();
  if (!c?.conversionTrackPurchase) return;
  const gtag = (window as Window & { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    gtag("event", "purchase", {
      transaction_id: params.transactionId,
      currency: params.currency,
      value: params.value,
      items: params.items.map((i) => ({
        item_id: String(i.id),
        item_name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
    });
  }
  const fbq = (window as Window & { fbq?: (...a: unknown[]) => void }).fbq;
  if (typeof fbq === "function") {
    fbq("track", "Purchase", {
      value: params.value,
      currency: params.currency,
      content_ids: params.items.map((i) => String(i.id)),
      content_type: "product",
    });
  }
}
