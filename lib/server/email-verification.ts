/**
 * Email validation via Abstract API Email Validation
 * https://www.abstractapi.com/api/email-validation-validation-api
 *
 * Set `EMAIL_VERIFICATION_API_KEY` in the environment. If unset, verification is skipped.
 */

const ABSTRACT_EMAIL_VALIDATION =
  "https://emailvalidation.abstractapi.com/v1/";

type Boolish = boolean | { value: boolean; text?: string } | undefined;

function readBool(f: Boolish): boolean | undefined {
  if (f === undefined) return undefined;
  if (typeof f === "boolean") return f;
  if (typeof f === "object" && f && "value" in f) return Boolean(f.value);
  return undefined;
}

type AbstractEmailResponse = {
  email?: string;
  deliverability?: string;
  is_valid_format?: Boolish;
  is_disposable_email?: Boolish;
  is_mx_found?: Boolish;
  is_smtp_valid?: Boolish;
};

export type EmailVerificationResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Returns whether the address passes API checks. When no API key is configured, always succeeds.
 */
export async function verifyEmailAddress(email: string): Promise<EmailVerificationResult> {
  const apiKey = process.env.EMAIL_VERIFICATION_API_KEY?.trim();
  if (!apiKey) {
    return { ok: true };
  }

  const trimmed = email.trim();
  if (!trimmed) {
    return { ok: false, message: "Email is required" };
  }

  const url = new URL(ABSTRACT_EMAIL_VALIDATION);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("email", trimmed);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });
  } catch (e) {
    console.error("Email verification fetch failed:", e);
    return {
      ok: false,
      message: "Could not verify email right now. Please try again in a moment.",
    };
  }

  if (res.status === 401 || res.status === 403) {
    console.error("Email verification API rejected the key (check EMAIL_VERIFICATION_API_KEY)");
    return {
      ok: false,
      message: "Email verification is misconfigured. Contact support.",
    };
  }

  if (!res.ok) {
    console.error("Email verification API HTTP", res.status);
    return {
      ok: false,
      message: "Email verification service is busy. Please try again shortly.",
    };
  }

  let data: AbstractEmailResponse;
  try {
    data = (await res.json()) as AbstractEmailResponse;
  } catch {
    return {
      ok: false,
      message: "Invalid response from email verification. Try again.",
    };
  }

  const formatOk = readBool(data.is_valid_format);
  if (formatOk === false) {
    return {
      ok: false,
      message: "That email address format is not valid.",
    };
  }

  const disposable = readBool(data.is_disposable_email);
  if (disposable === true) {
    return {
      ok: false,
      message: "Disposable or throwaway email addresses are not allowed.",
    };
  }

  const d = (data.deliverability ?? "").toUpperCase();
  if (d === "UNDELIVERABLE") {
    return {
      ok: false,
      message: "This email address does not appear to accept mail. Use another address.",
    };
  }

  return { ok: true };
}
