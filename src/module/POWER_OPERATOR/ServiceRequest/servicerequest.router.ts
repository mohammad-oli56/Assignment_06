import { Router } from "express"
import { UserRole } from "../../../../generated/prisma/client"
import { auth } from "../../../middleware/auth"
import { ServiceRequestController } from "./serviceRequest.controller"


const router = Router()

// Get all service requests
router.get(
  "/",
  auth(UserRole.POWER_OPERATOR),
  ServiceRequestController.getAllServiceRequests
)

// Get single service request
router.get(
  "/:id",
  auth(UserRole.POWER_OPERATOR),
  ServiceRequestController.getSingleServiceRequest
)

// Confirm service request
router.patch(
  "/:id/status",
  auth(UserRole.POWER_OPERATOR),
  ServiceRequestController.updateServiceRequestStatus
)

// Assign technician
router.post(
  "/:id/assign",
  auth(UserRole.POWER_OPERATOR),
  ServiceRequestController.assignTechnician
)

// Cancel service request
router.post(
  "/:id/cancel",
  auth(UserRole.POWER_OPERATOR),
  ServiceRequestController.cancelServiceRequest
)

export const ServiceRequestRouterOperator = router