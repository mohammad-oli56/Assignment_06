/*
  Warnings:

  - You are about to drop the column `amount` on the `service_requests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "service_requests" DROP COLUMN "amount",
ADD COLUMN     "technicianId" TEXT;

-- CreateIndex
CREATE INDEX "service_requests_technicianId_idx" ON "service_requests"("technicianId");

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "technicians"("id") ON DELETE SET NULL ON UPDATE CASCADE;
