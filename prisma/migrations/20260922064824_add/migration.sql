/*
  Warnings:

  - Added the required column `accountNumber` to the `service_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN     "accountNumber" TEXT NOT NULL;
