/*
  Warnings:

  - You are about to drop the column `user_id` on the `vendors` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `vendors` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."l_g_a_s" DROP CONSTRAINT "l_g_a_s_state_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."states" DROP CONSTRAINT "states_country_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."vendors" DROP CONSTRAINT "vendors_user_id_fkey";

-- DropIndex
DROP INDEX "public"."vendors_user_id_key";

-- AlterTable
ALTER TABLE "vendors" DROP COLUMN "user_id",
ADD COLUMN     "userId" INTEGER;

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendors_userId_key" ON "vendors"("userId");

-- AddForeignKey
ALTER TABLE "l_g_a_s" ADD CONSTRAINT "l_g_a_s_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "states" ADD CONSTRAINT "states_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
