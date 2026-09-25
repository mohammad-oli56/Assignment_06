/*
  Warnings:

  - Changed the type of `provider` on the `payments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('BKASH', 'SSLCOMMERZ');

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "provider",
ADD COLUMN     "provider" "Provider" NOT NULL;
