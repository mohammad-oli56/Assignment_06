import { Request, Response } from "express"
import { catchAsync } from "../../../utils/catchAsync"
import { sendResponse } from "../../../utils/sendResponse"
import { OutageService } from "./P.outage.service"




// ==================== GET ALL OUTAGES ====================

const getAllOutages = catchAsync(async (req: Request, res: Response) => {

      if (!req.user) {
      throw new Error("Unauthorized")
    }

    const result = await OutageService.getAllOutages(
      req.query,
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Outages retrieved successfully",
      data: result,
    })
  }
)

// ==================== SEARCH OUTAGES ====================

// const searchOutages = catchAsync(
//   async (req: Request, res: Response) => {
//     const search = String(req.query.q || "")
//     const page = String(req.query.page || "1")
//     const limit = String(req.query.limit || "10")

//     const result = await OutageService.searchOutages(
//       search,
//       page,
//       limit
//     )

//     sendResponse(res, {
//       statusCode: 200,
//       success: true,
//       message: "Outage search completed successfully",
//       data: result,
//     })
//   }
// )

// ==================== GET SINGLE OUTAGE ====================

const getSingleOutage = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OutageService.getSingleOutage(
      req.params.id as string
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Outage retrieved successfully",
      data: result,
    })
  }
)



// ==================== ASSIGN TECHNICIAN ====================

const assignTechnician = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OutageService.assignTechnician(
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

// ==================== UPDATE OUTAGE STATUS ====================

const updateOutageStatus = catchAsync(
  async (req: Request, res: Response) => {


   const result = await OutageService.updateOutageStatus(
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

// ==================== CANCEL OUTAGE ====================

const cancelOutage = catchAsync(
  async (req: Request, res: Response) => {
    

    const result = await OutageService.cancelOutage(
      req.params.id as string,
    
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Outage cancelled successfully",
      data: result,
    })
  }
)

// ==================== MY ASSIGNED OUTAGES ====================

// const getMyAssignedOutages = catchAsync(
//   async (req: Request, res: Response) => {
//     if (!req.user) {
//       throw new Error("Unauthorized")
//     }

//     const result = await OutageService.getMyAssignedOutages(
//       req.user.userId,
//       req.query
//     )

//     sendResponse(res, {
//       statusCode: 200,
//       success: true,
//       message: "Assigned outages retrieved successfully",
//       data: result,
//     })
//   }
// )

export const OutageController = {
  getAllOutages,
//   searchOutages,
  getSingleOutage,
//   deleteOutage,
  assignTechnician,
  updateOutageStatus,
  cancelOutage,
//   getMyAssignedOutages,
}

