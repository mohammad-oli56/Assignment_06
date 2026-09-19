import { UserRole, UserStatus } from "../../../generated/prisma/client"

export interface IGetAllUsersQuery {
  page?: string
  limit?: string
  search?: string
  role?: UserRole
  status?: UserStatus
}

export interface ICreateStaffPayload {
  name: string
  email: string
  password: string
  phone?: string
  role: UserRole

  // Only for Technician
  employeeId?: string
  specialization?: string
}

export interface IUpdateUserStatusPayload {
  status: UserStatus
}