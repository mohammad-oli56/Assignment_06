
import { prisma } from "../../../lib/prisma"

const getmyZoneSchedule = async (zoneId?: string) => {
  const whereCondition: any = {
    deletedAt: null,
  }

  // zoneId দিলে ওই Zone-এর schedule দেখাবে
  if (zoneId) {
    const zone = await prisma.zone.findFirst({
      where: {
        id: zoneId,
        deletedAt: null,
      },
    })

    if (!zone) {
      throw new Error("Zone not found")
    }

    whereCondition.zoneId = zoneId
  }

  const schedules = await prisma.schedule.findMany({
    where: whereCondition,
    include: {
      zone: true,
    },
    orderBy: {
      startTime: "asc",
    },
  })

  return schedules
}

const getSingleZoneSchedule = async (id: string) => {
  const schedule = await prisma.schedule.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      zone: true,
    },
  })

  if (!schedule) {
    throw new Error("Schedule not found")
  }

  return schedule
}

export const ScheduleService = {
  getmyZoneSchedule,
  getSingleZoneSchedule,
}

