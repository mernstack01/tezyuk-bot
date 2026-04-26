import * as bcrypt from 'bcrypt';
import { AdminRole, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const regions = [
  { key: 'toshkent', nameUz: 'Toshkent', topicId: 0 },
  { key: 'samarqand', nameUz: 'Samarqand', topicId: 0 },
  { key: 'andijon', nameUz: 'Andijon', topicId: 0 },
  { key: 'namangan', nameUz: 'Namangan', topicId: 0 },
  { key: 'fargona', nameUz: "Farg'ona", topicId: 0 },
  { key: 'buxoro', nameUz: 'Buxoro', topicId: 0 },
  { key: 'xorazm', nameUz: 'Xorazm', topicId: 0 },
  { key: 'qashqadaryo', nameUz: 'Qashqadaryo', topicId: 0 },
  { key: 'surxondaryo', nameUz: 'Surxondaryo', topicId: 0 },
  { key: 'jizzax', nameUz: 'Jizzax', topicId: 0 },
  { key: 'sirdaryo', nameUz: 'Sirdaryo', topicId: 0 },
  { key: 'navoiy', nameUz: 'Navoiy', topicId: 0 },
  { key: 'qoraqalpog', nameUz: "Qoraqalpog'iston", topicId: 0 },
];

async function main() {
  for (const region of regions) {
    await prisma.region.upsert({
      where: { key: region.key },
      create: region,
      update: {
        nameUz: region.nameUz,
        isActive: true,
      },
    });
  }

  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { username },
    create: {
      username,
      passwordHash,
      role: AdminRole.superadmin,
    },
    update: {
      passwordHash,
      role: AdminRole.superadmin,
    },
  });
}

void main()
  .catch(async (error) => {
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
