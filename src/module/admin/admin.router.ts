import { Router } from "express"

import { auth } from "../../middleware/auth"
import { UserRole } from "../../../generated/prisma/client"
import { AdminController } from "./admin.controller"

const router = Router()



router.get(
  "/users",
  auth(UserRole.ADMIN),
  AdminController.getAllUsers
)



router.get(
  "/users/:id",
  auth(UserRole.ADMIN),
  AdminController.singleUser
)

router.patch(
  "/users/:id/status",
  auth(UserRole.ADMIN),
  AdminController.updateUserStatus
)


router.delete(
  "/users/:id/delete",
  auth(UserRole.ADMIN),
  AdminController.deleteUser
)


router.post(
  "/createStaff",
  auth(UserRole.ADMIN),
  AdminController.createStaff
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