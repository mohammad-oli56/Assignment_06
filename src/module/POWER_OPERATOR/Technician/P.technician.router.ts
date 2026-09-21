import { Router } from "express";
import { auth } from "../../../middleware/auth";
import { UserRole } from "../../../../generated/prisma/enums";
import { PowerOperatorTechinicianController } from "./P.technician.controller";

const router =Router()

router.get("/",auth(UserRole.POWER_OPERATOR,UserRole.ADMIN),PowerOperatorTechinicianController.getAllTechnician)

export const PowerOperatorTechnicianRouter = router