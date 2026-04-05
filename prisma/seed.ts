import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/* Load .env / .env.local from project root before Prisma reads DATABASE_URL */
const root = process.cwd();
loadEnv({ path: resolve(root, ".env") });
loadEnv({ path: resolve(root, ".env.local"), override: true });

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is missing. Create a .env file in the project root (copy .env.example) with:\n" +
      '  DATABASE_URL="file:./dev.db"\n' +
      "Then run: npx prisma db push && npm run db:seed"
  );
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@blissfruits.local" },
    update: {},
    create: {
      username: "admin",
      email: "admin@blissfruits.local",
      passwordHash,
      fullName: "Store Admin",
      role: "admin",
    },
  });

  const catFruits = await prisma.category.upsert({
    where: { slug: "fresh-fruits" },
    update: {},
    create: {
      name: "Fresh Fruits",
      slug: "fresh-fruits",
      description: "Handpicked seasonal fruits",
      image: "/images/placeholder-fruit.jpg",
    },
  });

  await prisma.category.upsert({
    where: { slug: "berries" },
    update: {},
    create: {
      name: "Berries",
      slug: "berries",
      description: "Antioxidant-rich berries",
    },
  });

  const products = [
    {
      name: "Alphonso Mango",
      slug: "alphonso-mango",
      price: 349,
      comparePrice: 399,
      unit: "kg",
      stockQuantity: 50,
      imageMain: "/images/banner-hero.jpg",
      description: "Premium Ratnagiri Alphonso — sweet, aromatic, and naturally ripened.",
      shortDescription: "King of mangoes",
      sku: "BF-MGO-001",
      categoryId: catFruits.id,
      isFeatured: true,
    },
    {
      name: "Shimla Apple",
      slug: "shimla-apple",
      price: 189,
      unit: "kg",
      stockQuantity: 80,
      imageMain: "/images/banner-hero.jpg",
      description: "Crisp red apples from the hills.",
      sku: "BF-APL-001",
      categoryId: catFruits.id,
    },
    {
      name: "Banana Robusta",
      slug: "banana-robusta",
      price: 49,
      unit: "kg",
      stockQuantity: 120,
      imageMain: "/images/banner-hero.jpg",
      categoryId: catFruits.id,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  await prisma.banner.deleteMany();
  await prisma.banner.createMany({
    data: [
      {
        placement: "hero",
        title: "BlissFruitz,\nDirect from Farm",
        subtitle: "Organic, handpicked, and delivered fresh to your door.",
        linkUrl: "/shop",
        imagePath: "/images/banner-hero.jpg",
        sortOrder: 0,
      },
      {
        placement: "hero",
        title: "Seasonal picks\nfresh every week",
        subtitle: "Mangoes, berries, citrus — handpicked for peak flavour. Order online with fast delivery.",
        linkUrl: "/shop",
        imagePath: "/images/banner-hero.jpg",
        sortOrder: 1,
      },
      {
        placement: "hero",
        title: "Free shipping\nover ₹500",
        subtitle: "Stock up on your favourites and save on delivery. Mix and match from our full range.",
        linkUrl: "/shop?category=fresh-fruits",
        imagePath: "/images/banner-hero.jpg",
        sortOrder: 2,
      },
    ],
  });

  await prisma.offer.deleteMany();
  await prisma.offer.createMany({
    data: [
      {
        title: "Free shipping over ₹500",
        description: "Add more to your cart and save on delivery.",
        discountValue: 0,
        isActive: true,
        sortOrder: 0,
        highlight: false,
      },
      {
        title: "Welcome coupon",
        description: "Use WELCOME10 on checkout (demo).",
        couponCode: "WELCOME10",
        discountValue: 10,
        isActive: true,
        sortOrder: 1,
        highlight: true,
      },
    ],
  });

  await prisma.blogPost.deleteMany();
  await prisma.blogPost.create({
    data: {
      title: "Why seasonal fruits taste better",
      slug: "why-seasonal-fruits-taste-better",
      excerpt: "Eating with the seasons means peak flavour and nutrition.",
      content:
        "<p>Seasonal produce is harvested at the right time, travels less, and tastes better. At BlissFruitz we work with farms that pick at peak ripeness.</p>",
      coverImage: "/images/banner-hero.jpg",
      publishedAt: new Date(),
      isPublished: true,
    },
  });

  await prisma.settingsGeneral.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteName: "BlissFruitz",
      email: "support@freshfruit.com",
      phone: "+91 98765 43210",
      address: "123 New Street, Fruit City, India",
      timezone: "Asia/Kolkata",
      language: "en",
    },
  });
  await prisma.settingsPayment.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      currency: "INR",
      codEnabled: true,
      razorpayEnabled: true,
      stripeEnabled: false,
      paypalEnabled: false,
      autoRefundEnabled: false,
    },
  });
  await prisma.settingsShipping.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      flatRate: 50,
      freeShippingMin: 500,
      deliveryEtaNote: "Express: ~20 min – 2 hrs where available",
    },
  });

  await prisma.settingsProductCatalog.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      skuPrefix: "BF-",
      inventoryLowThreshold: 10,
    },
  });

  await prisma.settingsBackup.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  await prisma.settingsMaintenance.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, enabled: false },
  });

  await prisma.settingsApiIntegrations.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  await prisma.settingsCouponDefaults.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  await prisma.settingsInvoiceTax.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  await prisma.settingsUiTheme.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  await prisma.settingsEmailNotifications.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      orderConfirmSubject: "Order {{order_number}} confirmed",
      orderConfirmBody:
        "Hi {{customer_name}},\n\nThank you for your order. Total: {{order_total}}.\n\n— {{site_name}}",
      invoiceEmailSubject: "Invoice for order {{order_number}}",
      invoiceEmailBody: "Please find your invoice details for order {{order_number}}.\n\n— {{site_name}}",
    },
  });

  await prisma.settingsSecurity.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  await prisma.settingsAnalytics.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  await prisma.coupon.deleteMany();
  await prisma.coupon.create({
    data: {
      code: "WELCOME10",
      description: "10% off your first order",
      discountType: "percent",
      discountValue: 10,
      minOrder: 200,
      maxDiscount: 100,
      isActive: true,
    },
  });

  const dbPath = resolve(root, "prisma", "dev.db");
  const dbExists = existsSync(dbPath);
  console.log(
    "Seed OK — admin login: admin@blissfruits.local / Admin123!\n" +
      `SQLite file: ${dbPath} (${dbExists ? "exists" : "missing — run: npx prisma db push"})`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
