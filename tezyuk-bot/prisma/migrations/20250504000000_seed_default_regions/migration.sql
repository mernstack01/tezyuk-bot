-- Seed default Telegram forum topics for a fresh database.
-- This keeps the bot usable after `prisma migrate deploy` even before manual admin setup.
INSERT INTO "regions" ("key", "name_uz", "topic_id", "is_active")
VALUES
  ('toshkent', 'Toshkent', 3, true),
  ('samarqand', 'Samarqand', 9, true),
  ('andijon', 'Andijon', 6, true),
  ('namangan', 'Namangan', 4, true),
  ('fargona', 'Farg''ona', 5, true),
  ('buxoro', 'Buxoro', 12, true),
  ('xorazm', 'Xorazm', 49, true),
  ('qashqadaryo', 'Qashqadaryo', 10, true),
  ('surxondaryo', 'Surxondaryo', 13, true),
  ('jizzax', 'Jizzax', 8, true),
  ('sirdaryo', 'Sirdaryo', 7, true),
  ('navoiy', 'Navoiy', 13, true),
  ('qoraqalpog', 'Qoraqalpog''iston', 15, true),
  ('foreign', 'Chet Davlatlar (MDH + Xitoy)', 49, true)
ON CONFLICT ("key") DO UPDATE SET
  "name_uz" = EXCLUDED."name_uz",
  "topic_id" = EXCLUDED."topic_id",
  "is_active" = EXCLUDED."is_active";

INSERT INTO "app_settings" ("id", "daily_order_limit", "updated_at")
VALUES (1, 12, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
