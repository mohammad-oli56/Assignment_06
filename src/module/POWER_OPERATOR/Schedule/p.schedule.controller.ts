import { Request, Response } from "express"

import { catchAsync } from "../../../utils/catchAsync"
import { sendResponse } from "../../../utils/sendResponse"
import { ScheduleService } from "./P.schedule.services"


const createSchedule = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("Unauthorized")
    }

    const result = await ScheduleService.createSchedule(
      req.user.userId,
      req.body
    )

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Schedule created successfully 2",
      data: result,
    })
  }
)

const getAllSchedules = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ScheduleService.getAllSchedules(
      req.query
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Schedules retrieved successfully",
      data: result,
    })
  }
)

const getSingleSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ScheduleService.getSingleSchedule(
      req.params.id as string
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Schedule retrieved successfully",
      data: result,
    })
  }
)

const updateSchedule = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("User not found")
    }

    const { id } = req.params

    if (!id) {
      throw new Error("Schedule ID is required")
    }

    const result = await ScheduleService.updateSchedule(
      req.user.userId,
      id as string,
      req.body
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Schedule updated successfully",
      data: result,
    })
  }
)

const deleteSchedule = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("User not found")
    }

    const { id } = req.params

    if (!id) {
      throw new Error("Schedule ID is required")
    }

    const result = await ScheduleService.deleteSchedule(
      req.user.userId,
      id as string
    )

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Schedule deleted successfully",
      data: result,
    })
  }
)

export const ScheduleController = {
  createSchedule,
  getAllSchedules,
  getSingleSchedule,
  updateSchedule,
  deleteSchedule,
}