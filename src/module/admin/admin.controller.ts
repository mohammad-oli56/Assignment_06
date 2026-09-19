import { Request, Response } from "express"

import { catchAsync } from "../../utils/catchAsync"
import { AdminService } from "./admin.service"

// Get all users
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllUsers(req.query)

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data: result,
  })
})

// Create Technician / Power Operator
const createStaff = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.createStaff(req.body)

  res.status(201).json({
    success: true,
    message: "Staff created successfully",
    data: result,
  })
})

// Activate / Deactivate user
const updateUserStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params

    const result = await AdminService.updateUserStatus(
      id as string,
      req.body
    )

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: result,
    })
  }
)

// Soft delete user
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params

  const result = await AdminService.deleteUser(id as string)

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
    data: result,
  })
})

// Dashboard statistics
const getDashboardStats = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdminService.getDashboardStats()

    res.status(200).json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: result,
    })
  }
)

// Get audit logs
const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAuditLogs(req.query)

  res.status(200).json({
    success: true,
    message: "Audit logs retrieved successfully",
    data: result,
  })
})

export const AdminController = {
  getAllUsers,
  createStaff,
  updateUserStatus,
  deleteUser,
  getDashboardStats,
  getAuditLogs,
}