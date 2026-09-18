import { Router } from "express";
import { AuthController } from "./auth.controller";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";
import { UserValidation } from "./auth.validation";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router()

router.post("/register",validateRequest(UserValidation.userRegistrationZodSchema),AuthController.registeruser)
router.post("/verify-email",AuthController.verifyuseraccout)
router.post("/login",validateRequest(UserValidation.LoginZodSchema),AuthController.loginUser)
router.get("/me",auth(UserRole.ADMIN,UserRole.POWER_OPERATOR,UserRole.TECHNICIAN,UserRole.CUSTOMER),AuthController.getMe)
router.post("/refreshToken",AuthController.refreshToken)
router.post("/google",AuthController.googlelogin)

router.post("/forgot_password",AuthController.forgotpassword)
router.post("/reset-password",AuthController.resetpassword)

export const authRouts =router