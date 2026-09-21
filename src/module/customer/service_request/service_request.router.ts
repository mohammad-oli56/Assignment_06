import { Router } from "express"

import { auth } from "../../../middleware/auth"
import { UserRole } from "../../../../generated/prisma/enums"
import { ServiceRequestController } from "./service_request.controller"

const router = Router()

// Create new service request
router.post(
  "/",
  auth(UserRole.CUSTOMER),
  
  ServiceRequestController.createServiceRequest
)

// Customer's service request history
router.get(
  "/my",
  auth(UserRole.CUSTOMER),
  ServiceRequestController.getMyServiceRequests
)

// Get single service request
router.get(
  "/:id",
  auth(UserRole.CUSTOMER),
  ServiceRequestController.getSingleServiceRequest
)

// Cancel service request
router.post(
  "/:id/cancel",
  auth(UserRole.CUSTOMER),
  ServiceRequestController.cancelServiceRequest
)

export const ServiceRequestRouter = router