import { Router } from "express"
import { auth } from "../../../middleware/auth"
import { UserRole } from "../../../../generated/prisma/enums"
import { ScheduleController } from "./p.schedule.controller"


const router = Router()

router.post(
  "/",
  auth(UserRole.POWER_OPERATOR),

  ScheduleController.createSchedule
)

router.get(
  "/",
  auth(UserRole.POWER_OPERATOR),
  ScheduleController.getAllSchedules
)

router.get(
  "/:id",
  auth(UserRole.POWER_OPERATOR),
  ScheduleController.getSingleSchedule
)

router.patch(
  "/:id",
  auth(UserRole.POWER_OPERATOR),

  ScheduleController.updateSchedule
)

router.delete(
  "/:id",
  auth(UserRole.POWER_OPERATOR),
  ScheduleController.deleteSchedule
)

export const powerOperatorSchedul = router