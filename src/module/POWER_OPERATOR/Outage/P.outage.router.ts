
import { Router } from "express"
import { auth } from "../../../middleware/auth"
import { UserRole } from "../../../../generated/prisma/enums"
import { OutageController } from "./P.outage.controller"


const router = Router()

// ==================== OUTAGE ====================

// Customer reported সব outage দেখবে
router.get(
  "/",
  auth(UserRole.POWER_OPERATOR),
  OutageController.getAllOutages
)

// নির্দিষ্ট outage-এর details দেখবে
router.get(
  "/:id",
  auth(UserRole.POWER_OPERATOR),
  OutageController.getSingleOutage
)

// Technician assign করবে
router.post(
  "/:id/assign",
  auth(UserRole.POWER_OPERATOR),
  OutageController.assignTechnician
)

// Outage status update করবে
router.patch(
  "/:id/status",
  auth(UserRole.POWER_OPERATOR),
  OutageController.updateOutageStatus
)

// Outage cancel করবে
router.post(
  "/:id/cancel",
  auth(UserRole.POWER_OPERATOR),
  OutageController.cancelOutage
)

// ==================== TECHNICIAN ====================

// সব Technician দেখবে
// router.get(
//   "/technicians",
//   auth(UserRole.POWER_OPERATOR),
//   TechnicianController.getAllTechnicians
// )

// // Available Technician দেখবে
// router.get(
//   "/technicians/available",
//   auth(UserRole.POWER_OPERATOR),
//   TechnicianController.getAvailableTechnicians
// )

// // নির্দিষ্ট Technician-এর details
// router.get(
//   "/technicians/:id",
//   auth(UserRole.POWER_OPERATOR),
//   TechnicianController.getSingleTechnician
// )

export const PowerOperatorRouter = router 

