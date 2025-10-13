-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verification_code_created_at" TIMESTAMP(3),
ADD COLUMN     "phone_verification_code_created_at" TIMESTAMP(3);
