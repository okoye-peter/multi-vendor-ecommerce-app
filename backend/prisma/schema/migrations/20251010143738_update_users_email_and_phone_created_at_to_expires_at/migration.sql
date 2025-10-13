/*
  Warnings:

  - You are about to drop the column `email_verification_code_created_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone_verification_code_created_at` on the `users` table. All the data in the column will be lost.
  - Added the required column `address` to the `vendors` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "email_verification_code_created_at",
DROP COLUMN "phone_verification_code_created_at",
ADD COLUMN     "email_verification_code_expires_at" TIMESTAMP(3),
ADD COLUMN     "phone_verification_code_expires_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "stateId" INTEGER;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;
