import { appOrigin } from "@/lib/server/app-origin";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v3/userinfo";

export const OAUTH_STATE_COOKIE = "bf_oauth_state";
export const OAUTH_NEXT_COOKIE = "bf_oauth_next";

/** Use `requestOrigin` from the incoming request so redirect_uri matches the host the user used. */
export function googleRedirectUri(requestOrigin?: string): string {
  const base = (requestOrigin ?? appOrigin()).replace(/\/$/, "");
  return `${base}/api/auth/google/callback`;
}

function googleClientId(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
}

export function buildGoogleAuthUrl(state: string, requestOrigin?: string): string {
  const clientId = googleClientId();
  if (!clientId) throw new Error("Google OAuth client id is not configured");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleRedirectUri(requestOrigin),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  code: string,
  requestOrigin?: string
): Promise<{ access_token: string }> {
  const clientId = googleClientId();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured");

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: googleRedirectUri(requestOrigin),
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${t}`);
  }

  return res.json() as Promise<{ access_token: string }>;
}

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google userinfo failed: ${res.status} ${t}`);
  }
  return res.json() as Promise<GoogleUserInfo>;
}
