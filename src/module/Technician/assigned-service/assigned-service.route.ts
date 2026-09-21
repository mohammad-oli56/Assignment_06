import { Router } from "express"
import { auth } from "../../../middleware/auth"
import { UserRole } from "../../../../generated/prisma/enums"
import { AssignedServiceController } from "./assigned-service.controller"


const router = Router()

router.get(
  "/my-assigned",
  auth(UserRole.TECHNICIAN),
  AssignedServiceController.getMyAssignedServices
)

router.get(
  "/:id",
  auth(UserRole.TECHNICIAN),
  AssignedServiceController.getSingleAssignedService
)

router.patch(
  "/:id/status",
  auth(UserRole.TECHNICIAN),
  AssignedServiceController.updateServiceStatus
)

export const AssignedServiceRouter = router