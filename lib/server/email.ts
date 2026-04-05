import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

/**
 * Sends an email using the SMTP settings from the database.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  const settings = await prisma.settingsEmailNotifications.findUnique({ where: { id: 1 } });

  if (!settings || !settings.smtpEnabled) {
    console.warn("[Email Service] SMTP is disabled or not configured.");
    return { success: false, error: "SMTP disabled" };
  }

  const {
    smtpHost,
    smtpPort,
    smtpTls,
    smtpUser,
    smtpPassword,
    smtpFromEmail,
    smtpFromName,
  } = settings;

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.error("[Email Service] Missing SMTP configuration.");
    return { success: false, error: "Missing config" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: smtpTls,
      },
    });

    const info = await transporter.sendMail({
      from: `"${smtpFromName || "BlissFruitz"}" <${smtpFromEmail || smtpUser}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("[Email Service] Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email Service] Error sending email:", error);
    return { success: false, error };
  }
}
