const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst().then(u => {
  console.log('User keys:', Object.keys(u || {}));
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
