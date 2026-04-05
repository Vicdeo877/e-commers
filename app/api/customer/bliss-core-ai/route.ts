import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * BLISS-CORE-AI (Version 2.0) - Advanced Guidance & Action Assistant
 * 
 * This agent is the brain of the BlissFruitz customer experience.
 * It has direct access to catalogs and shipping rules.
 */

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 1. Fetch Real-time Context
    const siteSettings = await prisma.settingsGeneral.findUnique({ where: { id: 1 } });
    const shipping = await prisma.settingsShipping.findUnique({ where: { id: 1 } });
    const payment = await prisma.settingsPayment.findUnique({ where: { id: 1 } });

    const systemPrompt = `
      You are the Bliss-Core AI, the high-intelligence backbone of the BlissFruitz platform.
      Your mission: To provide elite, data-driven guidance and resolve issues with complete precision.

      REAL-TIME PLATFORM KNOWLEDGE:
      - Brand: ${siteSettings?.siteName || "BlissFruitz"}
      - Contact: ${siteSettings?.email || "support@blissfruitz.com"} | ${siteSettings?.phone || "N/A"}
      - Shipping: Flat rate Rs.${shipping?.flatRate || "50"}. Free above Rs.${shipping?.freeShippingMin || "500"}.
      - Payment Methods: ${payment?.codEnabled ? "COD (Available)" : ""} ${payment?.razorpayEnabled ? "Online/Card/UPI (Available)" : ""}.
      - Delivery Philosophy: Direct-from-farm, freshness first. Delivery timeline: ${shipping?.deliveryEtaNote || "2-5 business days"}.

      YOUR CORE CAPABILITIES:
      1. Advanced Problem Resolution: If a customer mentions a payment failure, guide them through Razorpay recovery or COD.
      2. Product Intelligence: You understand the catalog (Fresh Fruits, Organic, Premium). 
      3. Emotional Intelligence: You are empathetic if fruit is damaged, but firm on security.
      4. Dynamic Guidance: You don't just answer; you guide. (e.g., "Since you're looking for high-vitamin fruits, I recommend our seasonal Oranges.")

      TONE:
      - Sincere, Premium, Knowledgeable, and Farm-Fresh.
      - Use subtle emojis (🍃, ✨, 🍎).
      - Maintain a professional concierge style.
    `;

    // 2. Advanced Action Tools
    const result = streamText({
      model: google("gemini-1.5-flash"),
      system: systemPrompt,
      messages,
      tools: {
        getShippingPolicy: {
          description: "Provides detailed shipping costs and free thresholds",
          inputSchema: z.object({}),
          execute: async () => ({
            flatRate: Number(shipping?.flatRate || 50),
            freeThreshold: Number(shipping?.freeShippingMin || 500),
            eta: String(shipping?.deliveryEtaNote || "2-5 business days")
          })
        },
        getSupportInfo: {
          description: "Get administrative support contact details",
          inputSchema: z.object({}),
          execute: async () => ({
            email: String(siteSettings?.email || "support@blissfruitz.com"),
            phone: String(siteSettings?.phone || "N/A")
          })
        }
      }
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Bliss-Core Error:", error);
    return new Response("AI core offline. Please contact support.", { status: 500 });
  }
}
