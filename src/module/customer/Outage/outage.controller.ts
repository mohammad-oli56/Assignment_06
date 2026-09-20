import { Request, Response } from "express"

import { catchAsync } from "../../../utils/catchAsync"
import { sendResponse } from "../../../utils/sendResponse"
import { customerOutageService } from "./outage.service"





// ==========================================
// CREATE OUTAGE
// ==========================================

const createOutage = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("Unauthorized")
    }

    const result = await customerOutageService.createOutage(
      req.user.userId,
      req.body
    )

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Outage reported successfully",
      data: result,
    })
  }
)


// ==========================================
// GET SINGLE OUTAGE
// ==========================================

// const getSingleOutage = catchAsync(
//   async (req: Request, res: Response) => {
//     const { id } = req.params

//     const result = await customerOutageService.getSingleOutage(
//       id as string
//     )

//     sendResponse(res, {
//       statusCode: 200,
//       success: true,
//       message: "Outage retrieved successfully",
//       data: result,
//     })
//   }
// )


// ==========================================
// CANCEL OUTAGE
// ==========================================

// const cancelOutage = catchAsync(
//   async (req: Request, res: Response) => {
//     if (!req.user) {
//       throw new Error("Unauthorized")
//     }

//     const { id } = req.params

//     const result = await customerOutageService.cancelOutage(
//       id as string,
//       req.user.userId,
//       req.user.role
//     )

//     sendResponse(res, {
//       statusCode: 200,
//       success: true,
//       message: "Outage cancelled successfully",
//       data: result,
//     })
//   }
// )


// ==========================================
// EXPORT
// ==========================================

export const CustomerOutageController = {
  createOutage,
//   getSingleOutage,
//   cancelOutage,
}