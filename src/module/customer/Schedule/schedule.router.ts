import { Router } from "express";
import { auth } from "../../../middleware/auth";
import { UserRole } from "../../../../generated/prisma/enums";
import { ScheduleController } from "./schedule.controllet";



const router = Router()

router.get("/", auth(UserRole.CUSTOMER),ScheduleController.getmyZoneSchedule)

router.get("/details/:id",auth(UserRole.CUSTOMER),ScheduleController.getSingleZoneSchedule)

export const SchedulesRouter = router