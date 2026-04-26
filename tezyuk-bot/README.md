# YukMarkaz

YukMarkaz - NestJS, Prisma, PostgreSQL, Redis, BullMQ va Telegraf asosida qurilgan Telegram yuk bot platformasi.

## Asosiy imkoniyatlar

- Telegram bot orqali mijozni ro'yxatdan o'tkazish
- Wizard orqali bosqichma-bosqich yuk buyurtma qabul qilish
- Buyurtmani Prisma orqali PostgreSQL ga saqlash
- BullMQ orqali notification queue
- Telegram supergroup topic ga avtomatik e'lon yuborish
- JWT bilan himoyalangan admin REST API
- Swagger hujjatlari
- Winston logger
- Docker va docker-compose

## Ishga tushirish

1. `.env.example` dan `.env` yarating
2. Paketlarni o'rnating:

```bash
npm install
```

3. Prisma client yarating:

```bash
npx prisma generate
```

4. Migratsiya yarating:

```bash
npx prisma migrate dev --name init
```

5. Seed ishga tushiring:

```bash
npm run prisma:seed
```

6. Dastur:

```bash
npm run start:dev
```

7. Swagger:

```text
http://localhost:3000/docs
```

## Docker

```bash
docker compose up --build
```

## Admin API

- `POST /auth/login`
- `GET /admin/orders`
- `GET /admin/orders/:id`
- `PATCH /admin/orders/:id`
- `DELETE /admin/orders/:id`
- `GET /admin/users`
- `PATCH /admin/users/:id/block`
- `GET /admin/regions`
- `POST /admin/regions`
- `PATCH /admin/regions/:id`
- `GET /admin/stats`
