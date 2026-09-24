import { Router } from "express";
import { auth } from "../../../middleware/auth";
import { UserRole } from "../../../../generated/prisma/enums";
import { PaymentController } from "./payment.controller";


const router = Router()

router.post("/create", auth(UserRole.CUSTOMER),PaymentController.paymentCreate)


router.post("/conform",PaymentController.paymentconfirm)
router.post("/fail",PaymentController.paymentfail)


router.get("/history",auth(UserRole.CUSTOMER),PaymentController.paymentHistory)
router.get("/history/:id",auth(UserRole.CUSTOMER),PaymentController.paymentDetails)

export const PaymentRouter = router