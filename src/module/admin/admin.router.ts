import { Router } from "express"
import { AdminController } from "./admin.controller"
import { auth } from "../../middleware/auth"
import { UserRole } from "../../../generated/prisma/client"

const router = Router()

// Admin only routes

router.get(
  "/users",
  auth(UserRole.ADMIN),
  AdminController.getAllUsers
)

router.post(
  "/users",
  auth(UserRole.ADMIN),
  AdminController.createStaff
)

router.patch(
  "/users/:id/status",
  auth(UserRole.ADMIN),
  AdminController.updateUserStatus
)

router.delete(
  "/users/:id",
  auth(UserRole.ADMIN),
  AdminController.deleteUser
)

router.get(
  "/dashboard-stats",
  auth(UserRole.ADMIN),
  AdminController.getDashboardStats
)

router.get(
  "/audit-logs",
  auth(UserRole.ADMIN),
  AdminController.getAuditLogs
)

export const adminRouter = router