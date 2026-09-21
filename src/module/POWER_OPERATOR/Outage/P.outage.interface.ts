import { OutagePriority, OutageStatus } from "../../../../generated/prisma/enums"

export interface IOutageQuery {
  page?: string
  limit?: string
  search?: string
  status?: OutageStatus
  priority?: OutagePriority
  zoneId?: string
  technicianId?: string
}

export interface IUpdateOutageStatusPayload {
  status: OutageStatus
}

