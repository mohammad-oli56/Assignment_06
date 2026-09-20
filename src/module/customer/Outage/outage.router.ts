import { Router } from "express"
import { UserRole } from "../../../../generated/prisma/enums"
import { auth } from "../../../middleware/auth"
import { CustomerOutageController } from "./outage.controller"


const router = Router()


// Customer reports a new outage
router.post(
  "/",
  auth(UserRole.CUSTOMER),
  CustomerOutageController.createOutage
)


router.get(
  "/",
  auth(UserRole.CUSTOMER),
  CustomerOutageController.getAll_myOutage
)



router.get(
  "/:id",
  auth(UserRole.CUSTOMER),
  CustomerOutageController.getSingleOutage
)


// Customer cancels own outage
router.post(
  "/:id/cancel",
  auth(UserRole.CUSTOMER),
  CustomerOutageController.cancelOutage
)


export const custometOutageRouter = router