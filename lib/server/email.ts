import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export async function sendOrderNotification(orderId: number) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return;

    const emailSettings = await prisma.settingsEmailNotifications.findFirst();
    const generalSettings = await prisma.settingsGeneral.findFirst();

    const fromEmail = emailSettings?.smtpFromEmail || generalSettings?.email || "noreply@blissfruits.com";
    const fromName = emailSettings?.smtpFromName || generalSettings?.siteName || "BlissFruitz";
    const adminEmail = generalSettings?.email || "admin@blissfruits.com";
    const customerEmail = order.guestEmail || (order.userId ? (await prisma.user.findUnique({ where: { id: order.userId } }))?.email : null);

    if (!customerEmail && !adminEmail) return;

    const smtpPort = emailSettings?.smtpPort || 587;
    const isSmtpSecure = smtpPort === 465; // Port 465 is implicit TLS; 587 is explicit/STARTTLS

    const transporter = nodemailer.createTransport({
      host: emailSettings?.smtpHost || "",
      port: smtpPort,
      secure: isSmtpSecure,
      auth: emailSettings?.smtpEnabled ? {
        user: emailSettings.smtpUser || "",
        pass: emailSettings.smtpPassword || "",
      } : undefined,
      tls: {
        rejectUnauthorized: false // Skip self-signed cert errors for robustness
      }
    });

    if (!emailSettings?.smtpEnabled) {
        console.log(`\n[EMAIL SIMULATION] SMTP is DISABLED. The following email WOULD HAVE BEEN sent:`);
        console.log(`- To: ${customerEmail || 'No Customer Email'}, ${adminEmail || 'No Admin Email'}`);
        console.log(`- From: ${fromName} <${fromEmail}>`);
        console.log(`- Type: Order Notification (#${order.orderNumber})`);
        return;
    }

    const orderSummary = order.items.map(i => `- ${i.name} x ${i.quantity} (${(i.price * i.quantity).toFixed(2)})`).join("\n");
    const mapsLink = order.locationLink ? `\n\nDelivery Location: ${order.locationLink}` : "";

    // 1. Send to Customer
    if (customerEmail) {
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: customerEmail,
        subject: `Order Confirmation #${order.orderNumber}`,
        text: `Thank you for your order!\n\nOrder Total: ${order.total.toFixed(2)}\nItems:\n${orderSummary}${mapsLink}\n\nWe will notify you when it's shipped.`,
      });
    }

    // 2. Send to Admin
    if (adminEmail) {
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: adminEmail,
        subject: `New Order Received #${order.orderNumber}`,
        text: `A new order has been placed.\n\nCustomer: ${order.shippingName}\nPhone: ${order.shippingPhone}\nTotal: ${order.total.toFixed(2)}\nItems:\n${orderSummary}${mapsLink}\n\nView details in admin panel.`,
      });
    }

  } catch (error) {
    console.error("Email notification failed:", error);
  }
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  try {
    const emailSettings = await prisma.settingsEmailNotifications.findFirst();
    const generalSettings = await prisma.settingsGeneral.findFirst();

    const fromEmail = emailSettings?.smtpFromEmail || generalSettings?.email || "noreply@blissfruits.com";
    const fromName = emailSettings?.smtpFromName || generalSettings?.siteName || "BlissFruitz";

    const smtpPort = emailSettings?.smtpPort || 587;
    const isSmtpSecure = smtpPort === 465;

    if (!emailSettings?.smtpEnabled) {
      console.log(`\n[EMAIL SIMULATION] SMTP is DISABLED. The following email WOULD HAVE BEEN sent:`);
      console.log(`- To: ${to}`);
      console.log(`- From: ${fromName} <${fromEmail}>`);
      console.log(`- Subject: ${subject}`);
      return { success: false, message: "SMTP is disabled. Logged to console." };
    }

    const auth = (emailSettings.smtpUser && emailSettings.smtpPassword) ? {
      user: emailSettings.smtpUser,
      pass: emailSettings.smtpPassword,
    } : undefined;

    const transporter = nodemailer.createTransport({
      host: emailSettings.smtpHost || "",
      port: smtpPort,
      secure: isSmtpSecure,
      auth,
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text,
    });

    return { success: true };
  } catch (error) {
    console.error("Email send failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
