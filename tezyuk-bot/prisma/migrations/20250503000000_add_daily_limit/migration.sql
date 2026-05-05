-- AlterTable: per-user kunlik limit (null = global default ishlatiladi)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "daily_order_limit" INTEGER;
-- CreateTable: global sozlamalar (singleton, id=1)
CREATE TABLE IF NOT EXISTS "app_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "daily_order_limit" INTEGER NOT NULL DEFAULT 12,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);
