import { prisma } from "@/lib/prisma";
import type { GoogleUserInfo } from "@/lib/server/google-oauth";

function baseUsernameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "user";
  const s = local.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 20);
  return s || "user";
}

async function allocateUsername(email: string): Promise<string> {
  const base = baseUsernameFromEmail(email);
  for (let i = 0; i < 24; i++) {
    const candidate =
      i === 0 ? base : `${base}_${Math.random().toString(36).slice(2, 8)}`;
    const exists = await prisma.user.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
  }
  return `user_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
}

/**
 * Find or create a user from Google profile. Links `googleId` to an existing email when safe.
 */
export async function upsertGoogleUser(info: GoogleUserInfo) {
  if (!info.email_verified) {
    throw new Error("Google email is not verified");
  }

  const email = info.email.trim().toLowerCase();

  const byGoogle = await prisma.user.findUnique({ where: { googleId: info.sub } });
  if (byGoogle) return byGoogle;

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    if (byEmail.googleId && byEmail.googleId !== info.sub) {
      throw new Error("This email is linked to a different Google account");
    }
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { googleId: info.sub },
    });
  }

  const username = await allocateUsername(email);
  const fullName = (info.name ?? email.split("@")[0] ?? "User").trim() || "User";

  return prisma.user.create({
    data: {
      email,
      username,
      fullName,
      googleId: info.sub,
      passwordHash: null,
      role: "customer",
    },
  });
}
