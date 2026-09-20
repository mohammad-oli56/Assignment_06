import { prisma } from "../../../lib/prisma"
import { ICreateOutagePayload } from "../../outage/outage.interface"


const createOutage = async (
  userId: string,
  payload: ICreateOutagePayload
) => {
  const { zoneId, title, description, priority } = payload




  // Check zone
  const zone = await prisma.zone.findFirst({
    where: {
      id: zoneId,
      deletedAt: null,
    },
  })

  if (!zone) {
    throw new Error("Zone not found")
  }

  // Check active load shedding schedule
  const activeSchedule = await prisma.schedule.findFirst({
    where: {
      zoneId,
      status: "ACTIVE",
      deletedAt: null,
    },
  })

  if (activeSchedule) {
    throw new Error(
      "This zone currently has an active load shedding schedule"
    )
  }

  // Create outage
  const outage = await prisma.outage.create({
    data: {
      zoneId,
      reportedBy: userId,
      title,
      description,
      priority: priority ?? "MEDIUM",
      status: "REPORTED",
    },
    include: {
      zone: true,
    },
  })

  return outage
}

const getSingleOutage = async (

  outageId: string,
  userId: string,
) => {

  // console.log("outage id",outageId)



  const outage = await prisma.outage.findFirst({
    where: {
      id: outageId,
      reportedBy: userId,
      deletedAt: null,
    },
    include: {
      zone: true,
      technician: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      },
    },
  })

  if (!outage) {
    throw new Error("Outage not found")
  }

  return outage
}

const getall_myOutage = async (

  userId: string,
) => {

// console.log(userId)
  const outage = await prisma.outage.findMany({
    where: {
      
      reportedBy: userId,
      deletedAt: null,
    },
    include: {
      zone: true,
      technician: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      },
    },
  })

  if (!outage) {
    throw new Error("Outage not found")
  }

  return outage
}

const cancelOutage = async (
  
  outageId: string,
  userId: string,
) => {
  const outage = await prisma.outage.findFirst({
    where: {
      id: outageId,
      reportedBy: userId,
      deletedAt: null,
    },
  })

  if (!outage) {
    throw new Error("Outage not found")
  }

  if (
    outage.status === "RESTORED" ||
    outage.status === "CANCELLED"
  ) {
    throw new Error("This outage cannot be cancelled")
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedOutage = await tx.outage.update({
      where: {
        id: outageId,
      },
      data: {
        status: "CANCELLED",
      },
      include: {
        zone: true,
      },
    })

    // If technician was assigned, make technician available
    if (outage.technicianId) {
      await tx.technician.update({
        where: {
          id: outage.technicianId,
        },
        data: {
          status: "AVAILABLE",
        },
      })
    }

    return updatedOutage
  })

  return result
}

export const customerOutageService = {
  createOutage,
  getSingleOutage,
  cancelOutage,
  getall_myOutage
}