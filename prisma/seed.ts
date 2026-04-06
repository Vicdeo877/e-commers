import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/* Load .env / .env.local from project root before Prisma reads DATABASE_URL */
const root = process.cwd();
loadEnv({ path: resolve(root, ".env") });
loadEnv({ path: resolve(root, ".env.local"), override: true });

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  console.log("Seeding PRODUCTION database (Admin & Settings only)...");

  // 1. Create Admin
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

  // 2. Create Singleton Settings (id=1) 
  // These are required for the app to function properly without 500 errors.
  await prisma.settingsGeneral.upsert({ where: { id: 1 }, update: {}, create: { id: 1, siteName: "BlissFruitz", email: "admin@blissfruits.local" } });
  await prisma.settingsPayment.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.settingsShipping.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.settingsEmailNotifications.upsert({ where: { id: 1 }, update: {}, create: { id: 1, smtpEnabled: false } });
  await prisma.settingsSecurity.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.settingsUiTheme.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.settingsProductCatalog.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.settingsBackup.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.settingsMaintenance.upsert({ where: { id: 1 }, update: {}, create: { id: 1, enabled: false } });
  await prisma.settingsApiIntegrations.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.settingsCouponDefaults.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.settingsInvoiceTax.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.settingsAnalytics.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  console.log("Seed OK — admin login: admin@blissfruits.local / Admin123!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
