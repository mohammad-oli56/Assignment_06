import { Request, Response } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import { PowerOperatorTechnicianService } from "./P.technician.service";
import { sendResponse } from "../../../utils/sendResponse";

const getAllTechnician = catchAsync(async (req: Request, res: Response)=>{
    const result =  await PowerOperatorTechnicianService.getAllTechnician()


     sendResponse(res, {
          statusCode: 200,
          success: true,
          message: "Outage retrieved successfully",
          data: result,
        })
})


export const PowerOperatorTechinicianController ={
    getAllTechnician
}