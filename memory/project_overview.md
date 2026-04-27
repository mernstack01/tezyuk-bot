---
name: TezyukBot Project Overview
description: TezyukBot loyihasining to'liq arxitekturasi, modullari va business logikasi
type: project
---

# TezyukBot — Yuk Tashish Telegram Boti

**Why:** Yuk egalari Telegram orqali yuk tashish e'lonlarini joylashtirib, haydovchilar bilan bog'lana olsin. Admin panel orqali moderatsiya qilinadi.

**How to apply:** Har qanday yangi feature yoki bug fix uchun shu kontekstni asosga olish kerak.

---

## Loyiha tuzilishi

```
tezyukbot-full/
├── tezyuk-bot/       # NestJS backend + Telegram bot (Telegraf)
│   ├── prisma/       # PostgreSQL schema
│   └── src/
│       ├── admin/          # Admin REST API (JWT himoyalangan)
│       ├── auth/           # JWT login admin uchun
│       ├── notifications/  # BullMQ queue — Telegram guruhga e'lon yuborish
│       ├── orders/         # Buyurtmalar CRUD + statistika
│       ├── regions/        # Hududlar (viloyatlar)
│       ├── telegram/       # Bot handler, scene-lar, keyboard-lar
│       └── users/          # Foydalanuvchilar CRUD
└── tezyuk-admin/     # Next.js Admin panel (UI)
    └── src/app/(dashboard)/
        ├── dashboard/   # Statistika
        ├── orders/      # Buyurtmalar boshqaruvi
        ├── regions/     # Hududlar boshqaruvi
        └── users/       # Foydalanuvchilar boshqaruvi
```

---

## Database modellari (Prisma + PostgreSQL)

### User
- `telegramId` (unique BigInt), `phone`, `fullName`, `language` (uz/ru)
- `isBlocked` — admin bloklashi mumkin
- `orders` — bir foydalanuvchi ko'p buyurtma berishi mumkin

### Order
- `fromRegion`, `toRegion` — hudud kaliti (Region.key)
- `cargoName`, `weight`, `truckType`, `price`
- `status`: `pending | active | cancelled`
- `telegramMessageId` — guruhga yuborilgan xabar IDsi (bekor qilish uchun)
- Kunlik limit: 1 foydalanuvchi 24 soatda max 5 ta buyurtma

### Region
- `key` (unique), `nameUz`, `topicId` (Telegram forum topic ID), `isActive`
- Har bir viloyat Telegram guruhidagi alohida topicga ega

### Admin
- `username`, `passwordHash`, `role` (superadmin | moderator)
- JWT orqali auth

---

## Asosiy business logika

### Foydalanuvchi ro'yxatdan o'tish (register.scene.ts)
1. /start → ism so'raladi (min 3 harf)
2. Telefon raqam (Telegram contact button orqali)
3. `usersService.createOrUpdateByTelegram()` — upsert (mavjud bo'lsa yangilaydi)

### Buyurtma berish (order.scene.ts) — WizardScene, 8 qadam
1. Qayerdan (region inline keyboard, `from:key` callback)
2. Qayerga (region keyboard, `to:key`, same region bo'lmasin)
3. Yuk nomi (text, min 3 belgi)
4. Og'irlik (raqam bo'lishi shart)
5. Narx (ixtiyoriy matn)
6. Mashina turi (truck keyboard callback)
7. Tasdiqlash preview (confirm:yes / confirm:no)
8. `ordersService.createOrder()` → BullMQ queue ga yuboriladi
- `❌ Bekor qilish` reply keyboard istalgan vaqt bekor qiladi

### Telegram guruhga e'lon yuborish (notification.processor.ts — BullMQ)
1. Buyurtma yaratilganda `notificationProducer.addNotificationJob(order.id)`
2. Processor ishga tushadi:
   - `ANNOUNCEMENT_TOPIC_ID` topiciga yuboriladi (umumiy e'lonlar)
   - Agar region.topicId boshqa bo'lsa — viloyat topiciga ham yuboriladi
   - `order.telegramMessageId` saqlanadi (keyinchalik o'chirish/tahrirlash uchun)

### Admin panel funksiyalari
- Buyurtmalar: list (filter: status, region, page), detail, status o'zgartirish, bekor qilish
- Bekor qilganda: foydalanuvchiga Telegram orqali xabar yuboriladi
- Foydalanuvchilar: list, block/unblock
- Hududlar: CRUD (key, nameUz, topicId, isActive)
- Statistika: jami, pending, active buyurtmalar; bugungi; viloyat bo'yicha

### Foydalanuvchi o'z e'lonlari (telegram.service.ts)
- `/myorders` — oxirgi 10 ta e'lon, status icon bilan
- Har active e'lon yonida "❌ bekor qilish" tugmasi
- `cancelorder:{id}` callback → `ordersService.cancelOrder()`

### Guruh tozaligi
- `ANNOUNCEMENT_TOPIC_ID` topiciga foydalanuvchi yozsa — xabar o'chirilib, private xabar yuboriladi

---

## Texnologiyalar
- **Backend:** NestJS, Telegraf (nestjs-telegraf), Prisma, PostgreSQL, BullMQ (Redis), JWT, Winston logger
- **Admin UI:** Next.js (App Router), TypeScript, Tailwind CSS
- **Deployment:** Docker, docker-compose

---

## Muhim konstantalar (env)
- `GROUP_ID` — Telegram guruh ID
- `ANNOUNCEMENT_TOPIC_ID` — Umumiy e'lonlar topic ID
- `DATABASE_URL` — PostgreSQL
- `REDIS_URL` — BullMQ uchun
- `JWT_SECRET` — Admin auth
- `BOT_TOKEN` — Telegram bot token
