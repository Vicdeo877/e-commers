/** Public site origin (no trailing slash). Used for OAuth redirect URIs and absolute redirects. */
export function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Origin the browser used for this request. Prefer this for OAuth + Set-Cookie so the session
 * matches the host the user actually visits (localhost vs 127.0.0.1, www vs apex). Falls back to
 * `NEXT_PUBLIC_API_URL` only when headers are missing (tests).
 * Respects reverse proxies (`x-forwarded-host` / `x-forwarded-proto`).
 */
export function publicOriginFromRequest(req: Request): string {
  const url = new URL(req.url);
  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const proto = forwardedProto || url.protocol.replace(":", "") || "https";
    return `${proto}://${forwardedHost}`.replace(/\/$/, "");
  }
  return url.origin;
}

/** Only allow same-site relative paths after OAuth (open redirects). */
export function safeNextPath(raw: string | undefined | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}
