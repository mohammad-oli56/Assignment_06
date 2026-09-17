/*
  Warnings:

  - A unique constraint covering the columns `[googleid]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "authProvider" AS ENUM ('GOOGLE', 'CREDENTIAL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "authProvider" "authProvider" NOT NULL DEFAULT 'CREDENTIAL',
ADD COLUMN     "googleid" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_googleid_key" ON "users"("googleid");
