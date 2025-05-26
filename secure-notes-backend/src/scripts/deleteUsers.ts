// scripts/deleteUsers.ts
//kuna@debian:~/Desktop/BEMSI_2025L/secure-notes-backend/src$ npx ts-node scripts/deleteUsers.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.user.deleteMany({});
  console.log(`Deleted ${deleted.count} users.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
