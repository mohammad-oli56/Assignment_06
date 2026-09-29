import { Request, Response } from "express"
import { catchAsync } from "../../../utils/catchAsync"
import { sendResponse } from "../../../utils/sendResponse"
import { NotificationService } from "./notification.service"

const getmyNOtification = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("User not found")
    }

    const result = await NotificationService.getNotification(
      req.user.userId
    )

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Notifications retrieved successfully",
      data: result,
    })
  }
)

export const NotificationController = {
  getmyNOtification,
}