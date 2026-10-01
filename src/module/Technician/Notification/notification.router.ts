import { Router } from "express";
import { auth } from "../../../middleware/auth";
import { UserRole } from "../../../../generated/prisma/enums";
import { NotificationControllerTECHNICIAN } from "./notification.controller";





const router = Router()

router.get("/", auth(UserRole.TECHNICIAN),NotificationControllerTECHNICIAN.getmyNOtification)


export const NotificationRouterTECHNICIAN = router