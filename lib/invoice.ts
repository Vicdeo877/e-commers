/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Modern, Redesigned PDF Invoice and Shipping Sticker Generator.
 * Uses jsPDF + jspdf-autotable.
 * Supports different templates: Classic, Modern, Minimal.
 */
import { PublicSiteSettings } from "@/context/SiteSettingsContext";

interface InvoiceOrder {
  id: number;
  order_number: string;
  total: number;
  subtotal: number;
  shipping_amount: number;
  discount_amount?: number;
  order_status?: string;
  payment_status?: string;
  payment_method?: string;
  coupon_code?: string;
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  razorpay_payment_id?: string;
  created_at?: string;
  items?: { name: string; quantity: number; price: number; total: number }[];
}

/**
 * Helper to get site settings from the API for the invoice.
 * Since this is called from client components, we try to use the ones already provided
 * or fetch them if needed.
 */
async function fetchInvoiceSettings(): Promise<PublicSiteSettings["invoice"] | null> {
  try {
    const res = await fetch("/api/content/site-settings");
    const json = await res.json();
    return json?.data?.invoice || null;
  } catch (e) {
    console.error("Failed to fetch invoice settings", e);
    return null;
  }
}

export async function generateInvoicePDF(order: InvoiceOrder, settingsOverride?: PublicSiteSettings["invoice"]) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const settings = settingsOverride || (await fetchInvoiceSettings()) || {
    tax_scheme: "gst",
    tax_label: "GST",
    prices_tax_inclusive: false,
    pdf_company_name: "BlissFruitz",
    pdf_logo_url: null,
    invoice_template: "modern",
  };

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const primaryColor: [number, number, number] = [22, 163, 74]; // BlissFruitz Green

  const template = settings.invoice_template || "modern";

  // ─── Header ───
  if (template === "modern") {
    // Modern Header: Colorful border at top
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageW, 4, "F");
    
    let y = 15;
    // Company Name / Logo
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(settings.pdf_company_name || "BlissFruitz", margin, y);
    
    // Invoice Label Right
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(28);
    doc.text("INVOICE", pageW - margin, y, { align: "right" });
    
    y += 8;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Direct from Farm · Premium Fruits", margin, y);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Invoice No: #${order.order_number}`, pageW - margin, y, { align: "right" });

    y += 5;
    if (order.created_at) {
      doc.text(`Date: ${new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, pageW - margin, y, { align: "right" });
    }

    y += 10;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, pageW - margin, y);
  } else if (template === "minimal") {
    // Minimal Header
    let y = 20;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(settings.pdf_company_name || "BlissFruitz", margin, y);
    
    doc.setFontSize(12);
    doc.text("INVOICE", pageW - margin, y, { align: "right" });
    
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`#${order.order_number}`, pageW - margin, y, { align: "right" });
    y += 5;
    if (order.created_at) {
      doc.text(new Date(order.created_at).toLocaleDateString("en-IN"), pageW - margin, y, { align: "right" });
    }
  } else {
    // Classic Header (Band)
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageW, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(settings.pdf_company_name || "BlissFruitz", margin, 13);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Premium E-Commerce Platform", margin, 20);
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", pageW - margin, 13, { align: "right" });
    doc.setFontSize(10);
    doc.text(`#${order.order_number}`, pageW - margin, 20, { align: "right" });
  }

  // ─── Details ───
  let y = template === "classic" ? 40 : 45;

  // Split into 2 columns: Ship To | Order Info
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("SHIP TO", margin, y);
  doc.text("ORDER DETAILS", pageW / 2 + 10, y);

  y += 5;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  const shipLines = [
    order.shipping_name,
    order.shipping_phone,
    order.shipping_address,
    `${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}`
  ].filter(Boolean);

  let shipY = y;
  shipLines.forEach(line => {
    doc.text(line as string, margin, shipY, { maxWidth: 80 });
    shipY += 4.5;
  });

  let infoY = y;
  doc.text(`Status: ${(order.order_status || "pending").replace(/_/g, " ").toUpperCase()}`, pageW / 2 + 10, infoY);
  infoY += 4.5;
  doc.text(`Payment: ${(order.payment_method || "COD").toUpperCase()}`, pageW / 2 + 10, infoY);
  infoY += 4.5;
  doc.text(`Pay Status: ${(order.payment_status || "pending").toUpperCase()}`, pageW / 2 + 10, infoY);
  if (order.razorpay_payment_id) {
    infoY += 4.5;
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(`Txn ID: ${order.razorpay_payment_id}`, pageW / 2 + 10, infoY);
    doc.setTextColor(0);
    doc.setFontSize(9);
  }

  y = Math.max(shipY, infoY) + 8;

  // ─── Items Table ───
  autoTable(doc, {
    startY: y,
    head: [["#", "Product Description", "Qty", "Price", "Total"]],
    body: (order.items ?? []).map((item, idx) => [
      idx + 1,
      item.name,
      item.quantity,
      `Rs ${Number(item.price).toFixed(2)}`,
      `Rs ${Number(item.total).toFixed(2)}`,
    ]),
    theme: template === "minimal" ? "plain" : "striped",
    headStyles: {
      fillColor: template === "minimal" ? [255, 255, 255] : primaryColor,
      textColor: template === "minimal" ? [0, 0, 0] : [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      font: "helvetica",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
    margin: { left: margin, right: margin }
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ─── Totals ───
  const totalsX = pageW - margin - 60;
  const drawTotal = (label: string, value: string, isBold = false) => {
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(isBold ? 11 : 9);
    doc.setTextColor(isBold ? 0 : 80);
    doc.text(label, totalsX, y);
    doc.text(value, pageW - margin, y, { align: "right" });
    y += 6;
  };

  drawTotal("Subtotal:", `Rs ${Number(order.subtotal).toFixed(2)}`);
  drawTotal("Shipping:", order.shipping_amount > 0 ? `Rs ${Number(order.shipping_amount).toFixed(2)}` : "FREE");
  if (order.discount_amount && order.discount_amount > 0) {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    drawTotal(`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}:`, `-Rs ${Number(order.discount_amount).toFixed(2)}`);
  }
  
  doc.setDrawColor(200);
  doc.line(totalsX, y - 2, pageW - margin, y - 2);
  y += 2;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  drawTotal("GRAND TOTAL:", `Rs ${Number(order.total).toFixed(2)}`, true);

  // ─── Footer ───
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for your order! We hope you enjoy our fresh fruits.", pageW / 2, pageH - 15, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("Generated by BlissFruitz. This is a computer generated invoice.", pageW / 2, pageH - 10, { align: "center" });

  doc.save(`Invoice_${order.order_number}.pdf`);
}

export async function generateShippingSticker(order: InvoiceOrder) {
  const { default: jsPDF } = await import("jspdf");
  
  // Custom size for stickers (4x6 inches or 101.6x152.4 mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [100, 150]
  });

  const primaryColor: [number, number, number] = [22, 163, 74];
  const margin = 8;
  const w = 100;
  
  // Header Border
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1);
  doc.rect(2, 2, 96, 146);
  
  // Top Banner
  doc.setFillColor(...primaryColor);
  doc.rect(2, 2, 96, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("BlissFruitz", w / 2, 12, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("PREMIUM FRESH FRUITS", w / 2, 18, { align: "center" });

  let y = 32;
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DELIVER TO:", margin, y);
  
  y += 8;
  doc.setFontSize(14);
  doc.text(order.shipping_name?.toUpperCase() || "CUSTOMER", margin, y);
  
  y += 7;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Phone: ${order.shipping_phone || "N/A"}`, margin, y);
  
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const addrLines = doc.splitTextToSize(
    `${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}`,
    84
  );
  doc.text(addrLines, margin, y);
  y += (addrLines.length * 5) + 5;

  // Middle Line
  doc.setDrawColor(200);
  doc.line(margin, y, w - margin, y);
  y += 8;

  // Order Details
  doc.setFont("helvetica", "bold");
  doc.text("ORDER INFO:", margin, y);
  
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(`Order No: #${order.order_number}`, margin, y);
  
  const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN") : "N/A";
  doc.text(`Date: ${dateStr}`, w - margin, y, { align: "right" });
  
  y += 6;
  doc.text(`Items: ${order.items?.reduce((s, i) => s + i.quantity, 0) || 0} units`, margin, y);
  
  const payType = order.payment_method === "cod" ? "CASH ON DELIVERY" : "PREPAID";
  doc.setFont("helvetica", "bold");
  doc.setTextColor(order.payment_method === "cod" ? 200 : 0, 0, 0); // Red if COD
  doc.text(payType, w - margin, y, { align: "right" });
  
  y += 6;
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Rs ${Number(order.total).toFixed(2)}`, margin, y);
  
  if (order.payment_status === "paid") {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PAID ✓", w - margin, y, { align: "right" });
  } else {
    doc.setTextColor(220, 38, 38);
    doc.text("UNPAID", w - margin, y, { align: "right" });
  }

  // Large Order ID for easy reading
  y += 20;
  doc.setTextColor(230);
  doc.setFontSize(40);
  doc.setFont("helvetica", "bold");
  doc.text(order.order_number.slice(-4), w / 2, y, { align: "center" });

  // Handle with care note
  y = 140;
  doc.setDrawColor(...primaryColor);
  doc.line(margin, y - 5, w - margin, y - 5);
  doc.setTextColor(100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Handle With Care · Perishable Contents", w / 2, y, { align: "center" });
  doc.text("Keep Cool · Direct from Farm", w / 2, y + 4, { align: "center" });

  doc.save(`Sticker_${order.order_number}.pdf`);
}
