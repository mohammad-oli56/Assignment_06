import { Request, Response } from "express"
import { catchAsync } from "../../../utils/catchAsync"
import { sendResponse } from "../../../utils/sendResponse"
import { AssignedOutageService } from "./assigned-outage.service"

const getMyAssignedOutages = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("Unauthorized")
    }

    const result = await AssignedOutageService.getMyAssignedOutages(
      req.user.userId,
      req.query
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Assigned outages retrieved successfully",
      data: result,
    })
  }
)

const getSingleAssignedOutage = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("Unauthorized")
    }

    const result = await AssignedOutageService.getSingleAssignedOutage(
      req.user.userId,
      req.params.id as string
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Assigned outage retrieved successfully",
      data: result,
    })
  }
)

const updateOutageStatus = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("Unauthorized")
    }

    const result = await AssignedOutageService.updateOutageStatus(
      req.user.userId,
      req.params.id as string,
      req.body
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Outage status updated successfully",
      data: result,
    })
  }
)

export const AssignedOutageController = {
  getMyAssignedOutages,
  getSingleAssignedOutage,
  updateOutageStatus,
}