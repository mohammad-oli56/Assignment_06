import { Request, Response } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { ZoneService } from "./zone.service";

const createZone = catchAsync(async(req:Request,res:Response)=>{

    const payload = req.body

    const result =  await ZoneService.creatZone(payload)
      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'user registered successfully',
            data:result
            
        })
})

const getAllZones = catchAsync(async(req:Request,res:Response)=>{
     const result =  await ZoneService.getAllZone()
      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'user registered successfully',
            data:result
            
        })
})


export const ZoneController = {
    createZone,
    getAllZones
}