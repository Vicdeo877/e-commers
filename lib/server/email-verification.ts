/**
 * Local email and phone validation (No external API).
 */

export type EmailVerificationResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Validates email format via regex.
 */
export async function verifyEmailAddress(email: string): Promise<EmailVerificationResult> {
  const trimmed = email.trim();
  if (!trimmed) {
    return { ok: false, message: "Email is required" };
  }

  // Improved RFC 5322 regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmed)) {
    return { ok: false, message: "Invalid email address format." };
  }

  // Reject disposable-like domains (optional but requested to be strict)
  const blacklistedDomains = ["tempmail.com", "throwawaymail.com", "guerrillamail.com"];
  const domain = trimmed.split("@")[1]?.toLowerCase();
  if (domain && blacklistedDomains.includes(domain)) {
    return { ok: false, message: "Disposable email addresses are not allowed." };
  }

  return { ok: true };
}

/**
 * Validates phone number format (supports 10-digit Indian numbers).
 */
export async function verifyPhoneNumber(phone: string): Promise<EmailVerificationResult> {
  const trimmed = phone.trim().replace(/[\s-]/g, "");
  if (!trimmed) {
    return { ok: false, message: "Phone number is required" };
  }

  // 10 digits, starts with 6-9
  const phoneRegex = /^[6-9]\d{9}$/;
  
  if (!phoneRegex.test(trimmed)) {
    return { ok: false, message: "Please enter a valid 10-digit mobile number." };
  }

  return { ok: true };
}
