import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/auth";

/**
 * BLISS-ADMIN-HUB-AI (Version 3.0) - Advanced AI Hub
 * 
 * This agent is the dedicated assistant for store administrators.
 * It manages orders, invoices, and site settings guidance.
 */

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { messages } = await req.json();

    const systemPrompt = `
      You are the Bliss-Admin Hub AI, the brain of our commerce engine.
      Your mission: To provide elite, data-driven administrative guidance for the store owner.

      ADMINISTRATIVE KNOWLEDGE:
      1. Orders: View/Update (Confirmed, Processing, Shipped, Delivered).
      2. Products: You manage fruit catalog, pricing, and stock.
      3. Global Settings:
        - Invoice Logic: Classic, Modern, Minimal options.
        - Tax Schemes: Per Product Tax or Global.
        - Email: Critical SMTP (Host, Port, User, Pass).
        - Payments: Toggle COD or Razorpay.
        - Maintenance: Set store offline with custom message.

      YOUR CORE CAPABILITIES:
      1. Issue Setup guidance: "To fix the email issue, go to Settings -> Email and confirm your SMTP details."
      2. Status Management: "To ship an order, click the 'Shipped' button and provide the tracking number."
      3. Design Consulting: "Try the 'Modern' invoice template for a cleaner, high-end customer experience."

      TONE:
      - Technical Assistant, Precise, Bold, Efficient.
      - Like a Chief Technology Officer assisting the board.
    `;

    const result = streamText({
      model: google("gemini-1.5-pro-latest"),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Bliss-Admin Error:", error);
    return new Response("Admin hub connection lost.", { status: 500 });
  }
}
