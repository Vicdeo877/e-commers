import { jsonOk, jsonErr } from "@/lib/server/http";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/server/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return jsonErr("Name, email and message are required", 400);
    }

    // Save the message to the database first!
    const savedMessage = await prisma.contactMessage.create({
      data: { name, email, subject, message, isRead: false }
    });

    // Get the administrative email from General Settings
    const settings = await prisma.settingsGeneral.findFirst();
    const adminEmail = settings?.email || "admin@blissfruits.com";

    // Attempt to send an email using the SMTP service
    const emailResult = await sendEmail({
      to: adminEmail,
      subject: `[Contact Form] ${subject || "New Message"}`,
      html: `
        <h3>New Message from BlissFruitz Contact Form</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || "N/A"}</p>
        <p><strong>Message:</strong></p>
        <div style="padding: 15px; background: #f9f9f9; border: 1px solid #eee; border-radius: 4px; color: #333;">
          ${message.replace(/\n/g, "<br>")}
        </div>
      `,
      text: `New Message from ${name} (${email})\nSubject: ${subject || "N/A"}\n\nMessage:\n${message}`,
    });

    console.log(`[Contact Form] Email processing result:`, emailResult);
    
    return jsonOk({ 
      message: (emailResult as any).success 
        ? "Thank you for your message. We have received it and will get back to you soon." 
        : "Thank you for your message. Our team has been notified (Simulation Mode)." 
    });
  } catch (e) {
    console.error("Contact form error:", e);
    return jsonErr("Internal technical error. Please try again later or contact us directly.", 500);
  }
}
