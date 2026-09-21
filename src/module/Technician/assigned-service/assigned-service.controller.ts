import { Request, Response } from "express"
import { catchAsync } from "../../../utils/catchAsync"
import { sendResponse } from "../../../utils/sendResponse"
import { AssignedServiceService } from "./assigned-service.service"

const getMyAssignedServices = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("Unauthorized")
    }

    const result = await AssignedServiceService.getMyAssignedServices(
      req.user.userId,
      req.query
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Assigned services retrieved successfully",
      data: result,
    })
  }
)

const getSingleAssignedService = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("Unauthorized")
    }

    const result = await AssignedServiceService.getSingleAssignedService(
      req.user.userId,
      req.params.id as string
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Assigned service retrieved successfully",
      data: result,
    })
  }
)

const updateServiceStatus = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("Unauthorized")
    }

    const result = await AssignedServiceService.updateServiceStatus(
      req.user.userId,
      req.params.id as string,
      req.body
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Service status updated successfully",
      data: result,
    })
  }
)

export const AssignedServiceController = {
  getMyAssignedServices,
  getSingleAssignedService,
  updateServiceStatus,
}