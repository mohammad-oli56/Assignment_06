import { Request, Response } from "express"
import { catchAsync } from "../../../utils/catchAsync"
import { sendResponse } from "../../../utils/sendResponse"
import { ServiceRequestService } from "./serviceRequest.service"


const getAllServiceRequests = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceRequestService.getAllServiceRequests(
      req.query
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Service requests retrieved successfully",
      data: result,
    })
  }
)

const getSingleServiceRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceRequestService.getSingleServiceRequest(
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

const updateServiceRequestStatus = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceRequestService.updateServiceRequestStatus(
      req.params.id as string,
      req.body
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Service request status updated successfully",
      data: result,
    })
  }
)

const assignTechnician = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceRequestService.assignTechnician(
      req.params.id as string,
      req.body.technicianId
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Technician assigned successfully",
      data: result,
    })
  }
)

const cancelServiceRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceRequestService.cancelServiceRequest(
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
  getAllServiceRequests,
  getSingleServiceRequest,
  updateServiceRequestStatus,
  assignTechnician,
  cancelServiceRequest,
}