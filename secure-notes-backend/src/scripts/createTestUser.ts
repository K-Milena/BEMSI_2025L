// scripts/createTestUser.ts
// npx ts-node scripts/createTestUser.ts


import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'testuser@example.com';
  const plainPassword = 'testpassword123';

  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
    },
  });

  console.log('Created user:', user);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
