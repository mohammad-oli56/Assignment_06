import { Request, Response } from "express"
import { catchAsync } from "../../../utils/catchAsync"
import { sendResponse } from "../../../utils/sendResponse"
import { ServiceRequestService } from "./service_request.service"


const createServiceRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceRequestService.createServiceRequest(
      req.user!.userId,
      req.body
    )

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Service request created successfully",
      data: result,
    })
  }
)

const getMyServiceRequests = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceRequestService.getMyServiceRequests(
      req.user!.userId
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Service request history retrieved successfully",
      data: result,
    })
  }
)

const getSingleServiceRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceRequestService.getSingleServiceRequest(
      req.user!.userId,
      req.params.id as string
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Service request retrieved successfully",
      data: result,
    })
  }
)

const cancelServiceRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceRequestService.cancelServiceRequest(
      req.user!.userId,
      req.params.id as string
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Service request cancelled successfully",
      data: result,
    })
  }
)

export const ServiceRequestController = {
  createServiceRequest,
  getMyServiceRequests,
  getSingleServiceRequest,
  cancelServiceRequest,
}