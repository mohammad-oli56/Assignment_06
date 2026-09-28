import { Request, Response } from "express"

import { catchAsync } from "../../utils/catchAsync"
import { AdminService } from "./admin.service"
import { sendResponse } from "../../utils/sendResponse"


// Get all users
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllUsers(req.query)

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data: result,
  })
})


const singleUser = catchAsync(async (req: Request, res: Response) => {

  // console.log(req.params.id)


  const result = await AdminService.getSingleuser(

    req.params.id as string
  )

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Service request cancelled successfully",
    data: result,
  })
})


// Create Technician / Power Operator
const createStaff = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error("User not found");
  }
  const result = await AdminService.createStaff(req.user, req.body)

  res.status(201).json({
    success: true,
    message: "Staff created successfully",
    data: result,
  })
})

// Activate / Deactivate user
const updateUserStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.user) {
      throw new Error("User not found");
    }

    const result = await AdminService.updateUserStatus(
      req.user,
      id as string,
      req.body.status
    );

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: result,
    });
  }
);

// Soft delete user
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  if (!req.user) {
    throw new Error("User not found");
  }
  const result = await AdminService.deleteUser(req.user, id as string)

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
  singleUser
}