/*
  Warnings:

  - Added the required column `author_role` to the `audit_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "author_role" "UserRole" NOT NULL;
