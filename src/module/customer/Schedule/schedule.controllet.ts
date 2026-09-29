
import { Request, Response } from "express"
import { sendResponse } from "../../../utils/sendResponse"
import { catchAsync } from "../../../utils/catchAsync"
import { ScheduleService } from "./schedule.service"

const getmyZoneSchedule = catchAsync(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new Error("User not found")
        }

        const { zoneId } = req.query

        const result = await ScheduleService.getmyZoneSchedule(
            typeof zoneId === "string" ? zoneId : undefined
        )

        sendResponse(res, {
            success: true,
            statusCode: 200,
            message: "Schedules retrieved successfully",
            data: result,
        })
    }
)

const getSingleZoneSchedule = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("User not found")
    }

    const { id } = req.params

    if (!id) {
      throw new Error("Schedule ID is required")
    }

    const result = await ScheduleService.getSingleZoneSchedule(id as string)

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Schedule retrieved successfully",
      data: result,
    })
  }
)

export const ScheduleController = {
    getmyZoneSchedule,
    getSingleZoneSchedule,
}

