
import { prisma } from "../../../lib/prisma"
import { ICreateSchedulePayload, IScheduleQuery, IUpdateSchedulePayload } from "./P.schedule.interface"



const createSchedule = async (
  userId: string,
  payload: ICreateSchedulePayload
) => {
  const {
    zoneId,
    startTime,
    endTime,
    reason,
  } = payload

  const zone = await prisma.zone.findFirst({
    where: {
      id: zoneId,
      deletedAt: null,
    },
  })

  if (!zone) {
    throw new Error("Zone not found")
  }

  const start = new Date(startTime)
  const end = new Date(endTime)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid start or end time")
  }

  if (start >= end) {
    throw new Error("Start time must be before end time")
  }

  const overlappingSchedule =
    await prisma.schedule.findFirst({
      where: {
        zoneId,
        deletedAt: null,
        status: {
          in: ["SCHEDULED", "ACTIVE"],
        },
        startTime: {
          lt: end,
        },
        endTime: {
          gt: start,
        },
      },
    })

  if (overlappingSchedule) {
    throw new Error(
      "Another schedule already exists for this time period"
    )
  }

  const result = await prisma.$transaction(async (tx) => {
    const schedule = await tx.schedule.create({
      data: {
        zoneId,
        createdBy: userId,
        startTime: start,
        endTime: end,
        reason,
        status: "SCHEDULED",
      },
      include: {
        zone: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    await tx.auditLog.create({
      data: {
        userId,
        author_role: "POWER_OPERATOR",
        action: "CREATE_SCHEDULE",
        entityType: "SCHEDULE",
        entityId: schedule.id,
      },
    })

    return schedule
  })

  return result
}

const getAllSchedules = async (
  query: IScheduleQuery = {}
) => {
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 10
  const skip = (page - 1) * limit

  const where: any = {
    deletedAt: null,
  }

  if (query.status) {
    where.status = query.status
  }

  if (query.zoneId) {
    where.zoneId = query.zoneId
  }

  const [data, total] = await Promise.all([
    prisma.schedule.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        startTime: "desc",
      },
      include: {
        zone: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),

    prisma.schedule.count({
      where,
    }),
  ])

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  }
}

const getSingleSchedule = async (scheduleId: string) => {
  const schedule = await prisma.schedule.findFirst({
    where: {
      id: scheduleId,
      deletedAt: null,
    },
    include: {
      zone: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!schedule) {
    throw new Error("Schedule not found")
  }

  return schedule
}



const updateSchedule = async (
  userId: string,
  scheduleId: string,
  payload: IUpdateSchedulePayload
) => {
  const existingSchedule = await prisma.schedule.findFirst({
    where: {
      id: scheduleId,
      deletedAt: null,
    },
  })

  if (!existingSchedule) {
    throw new Error("Schedule not found")
  }

  const zoneId = payload.zoneId ?? existingSchedule.zoneId

  const startTime = payload.startTime
    ? new Date(payload.startTime)
    : existingSchedule.startTime

  const endTime = payload.endTime
    ? new Date(payload.endTime)
    : existingSchedule.endTime

  if (
    isNaN(startTime.getTime()) ||
    isNaN(endTime.getTime())
  ) {
    throw new Error("Invalid start or end time")
  }

  if (startTime >= endTime) {
    throw new Error("Start time must be before end time")
  }

  const zone = await prisma.zone.findFirst({
    where: {
      id: zoneId,
      deletedAt: null,
    },
  })

  if (!zone) {
    throw new Error("Zone not found")
  }

  const overlappingSchedule =
    await prisma.schedule.findFirst({
      where: {
        id: {
          not: scheduleId,
        },
        zoneId,
        deletedAt: null,
        status: {
          in: ["SCHEDULED", "ACTIVE"],
        },
        startTime: {
          lt: endTime,
        },
        endTime: {
          gt: startTime,
        },
      },
    })

  if (overlappingSchedule) {
    throw new Error(
      "Another schedule already exists for this time period"
    )
  }

  const result = await prisma.$transaction(async (tx) => {
    const schedule = await tx.schedule.update({
      where: {
        id: scheduleId,
      },
      data: {
        zoneId,
        startTime,
        endTime,
        reason: payload.reason,
        status: payload.status,
      },
      include: {
        zone: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    await tx.auditLog.create({
      data: {
        userId,
        author_role: "POWER_OPERATOR",
        action: "UPDATE_SCHEDULE",
        entityType: "SCHEDULE",
        entityId: schedule.id,
      },
    })

    return schedule
  })

  return result
}


const deleteSchedule = async (
  userId: string,
  scheduleId: string
) => {
  const schedule = await prisma.schedule.findFirst({
    where: {
      id: scheduleId,
      deletedAt: null,
    },
  })

  if (!schedule) {
    throw new Error("Schedule not found")
  }

  if (
    schedule.status === "ACTIVE" ||
    schedule.status === "COMPLETED"
  ) {
    throw new Error(
      "Active or completed schedule cannot be deleted"
    )
  }

  const result = await prisma.$transaction(async (tx) => {
    const deletedSchedule = await tx.schedule.update({
      where: {
        id: scheduleId,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    await tx.auditLog.create({
      data: {
        userId,
        author_role: "POWER_OPERATOR",
        action: "DELETE_SCHEDULE",
        entityType: "SCHEDULE",
        entityId: scheduleId,
      },
    })

    return deletedSchedule
  })

  return result
}

export const ScheduleService = {
  createSchedule,
  getAllSchedules,
  getSingleSchedule,
  updateSchedule,
  deleteSchedule
}