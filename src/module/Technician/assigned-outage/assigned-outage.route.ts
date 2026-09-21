import { Router } from "express"
import { auth } from "../../../middleware/auth"
import { UserRole } from "../../../../generated/prisma/enums"
import { AssignedOutageController } from "./assigned-outage.controller"


const router = Router()

router.get(
  "/my-assigned",
  auth(UserRole.TECHNICIAN),
  AssignedOutageController.getMyAssignedOutages
)

router.get(
  "/:id",
  auth(UserRole.TECHNICIAN),
  AssignedOutageController.getSingleAssignedOutage
)

router.patch(
  "/:id/status",
  auth(UserRole.TECHNICIAN),
  AssignedOutageController.updateOutageStatus
)

export const AssignedOutageRouter = router