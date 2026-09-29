import { Router } from "express";
import { auth } from "../../../middleware/auth";
import { UserRole } from "../../../../generated/prisma/enums";
import { NotificationController } from "./notification.controller";




const router = Router()

router.get("/", auth(UserRole.CUSTOMER),NotificationController.getmyNOtification)


export const NotificationRouter = router