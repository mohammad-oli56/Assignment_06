export interface ICreateSchedulePayload {
  zoneId: string
  startTime: string
  endTime: string
  reason?: string
}


export interface IScheduleQuery {
  page?: string
  limit?: string
  status?: string
  zoneId?: string
}

export interface IUpdateSchedulePayload {
  zoneId?: string
  startTime?: string
  endTime?: string
  reason?: string
  status?: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED"
}