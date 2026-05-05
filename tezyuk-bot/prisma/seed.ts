import * as bcrypt from 'bcrypt';
import { AdminRole, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const regions = [
  { key: 'toshkent', nameUz: 'Toshkent', topicId: 3 },
  { key: 'samarqand', nameUz: 'Samarqand', topicId: 9 },
  { key: 'andijon', nameUz: 'Andijon', topicId: 6 },
  { key: 'namangan', nameUz: 'Namangan', topicId: 4 },
  { key: 'fargona', nameUz: "Farg'ona", topicId: 5 },
  { key: 'buxoro', nameUz: 'Buxoro', topicId: 12 },
  { key: 'xorazm', nameUz: 'Xorazm', topicId: 49 },
  { key: 'qashqadaryo', nameUz: 'Qashqadaryo', topicId: 10 },
  { key: 'surxondaryo', nameUz: 'Surxondaryo', topicId: 13 },
  { key: 'jizzax', nameUz: 'Jizzax', topicId: 8 },
  { key: 'sirdaryo', nameUz: 'Sirdaryo', topicId: 7 },
  { key: 'navoiy', nameUz: 'Navoiy', topicId: 13 },
  { key: 'qoraqalpog', nameUz: "Qoraqalpog'iston", topicId: 15 },
  // Chet davlatlar — faqat "qayerga" uchun, qayerdan da ko'rinmasin (scene ichida filtrlanadi)
  { key: 'foreign', nameUz: 'Chet Davlatlar (MDH + Xitoy)', topicId: 49 },
];

async function main() {
  for (const region of regions) {
    await prisma.region.upsert({
      where: { key: region.key },
      create: region,
      update: {
        nameUz: region.nameUz,
        topicId: region.topicId,
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
