import { Router } from "express";
import { ZoneController } from "./zone.controller";
import { auth } from "../../../middleware/auth";
import { UserRole } from "../../../../generated/prisma/enums";

const router = Router()

router.post("/zones",auth(UserRole.POWER_OPERATOR,UserRole.ADMIN),ZoneController.createZone)
router.get("/zones",ZoneController.getAllZones)



export const ZoneRouter = router