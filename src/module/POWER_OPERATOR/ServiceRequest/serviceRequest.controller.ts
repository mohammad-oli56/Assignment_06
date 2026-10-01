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
    if (!req.user) {
      throw new Error("User not found")
    }

    const { id } = req.params

    if (!id) {
      throw new Error("Service request ID is required")
    }

    const result =
      await ServiceRequestService.updateServiceRequestStatus(
        req.user.userId,
        id as string,
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
    if (!req.user) {
      throw new Error("User not found")
    }

    const { id } = req.params
    const { technicianId } = req.body

    if (!id) {
      throw new Error("Service request ID is required")
    }

    if (!technicianId) {
      throw new Error("Technician ID is required")
    }

    const result =
      await ServiceRequestService.assignTechnician(
        req.user.userId,
        id as string,
        technicianId
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
    if (!req.user) {
      throw new Error("User not found")
    }

    const { id } = req.params

    if (!id) {
      throw new Error("Service request ID is required")
    }

    const result =
      await ServiceRequestService.cancelServiceRequest(
        req.user.userId,
        id as string
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