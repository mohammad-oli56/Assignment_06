import { OutageStatus, TechnicianStatus, UserRole } from "../../../../generated/prisma/enums"
import { prisma } from "../../../lib/prisma"
import { IOutageQuery, IUpdateOutageStatusPayload } from "./P.outage.interface"

const getAllOutages = async (query: IOutageQuery = {}) => {
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 10
  const skip = (page - 1) * limit

  const where: any = {
    deletedAt: null,
  }

  // Search by title or description
  if (query.search) {
    where.OR = [
      {
        title: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: query.search,
          mode: "insensitive",
        },
      },
    ]
  }

  // Filter by status
  if (query.status) {
    where.status = query.status
  }

  // Filter by priority
  if (query.priority) {
    where.priority = query.priority
  }

  // Filter by zone
  if (query.zoneId) {
    where.zoneId = query.zoneId
  }

  // Filter by technician
  if (query.technicianId) {
    where.technicianId = query.technicianId
  }

  const [data, total] = await Promise.all([
    prisma.outage.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        zone: true,

        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },

        technician: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    }),

    prisma.outage.count({
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


const getSingleOutage = async (outageId: string) => {
  const outage = await prisma.outage.findFirst({
    where: {
      id: outageId,
      deletedAt: null,
    },
    include: {
      zone: true,

      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },

      technician: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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

const assignTechnician = async (
  outageId: string,
  technicianId: string
) => {
  const outage = await prisma.outage.findFirst({
    where: {
      id: outageId,
      deletedAt: null,
    },
  })

  if (!outage) {
    throw new Error("Outage not found")
  }

  if (outage.status !== "ACKNOWLEDGED") {
    throw new Error(
      "Outage must be ACKNOWLEDGED before assigning a technician"
    )
  }

  if (outage.technicianId) {
    throw new Error("A technician is already assigned to this outage")
  }

  const technician = await prisma.technician.findFirst({
    where: {
      id: technicianId,
      user: {
        isActive: true,
        deletedAt: null,
        role: "TECHNICIAN",
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  })

  if (!technician) {
    throw new Error("Technician not found")
  }

  if (technician.status !== "AVAILABLE") {
    throw new Error("Technician is not available")
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedOutage = await tx.outage.update({
      where: {
        id: outageId,
      },
      data: {
        technicianId: technician.id,
        status: "ASSIGNED",
      },
      include: {
        zone: true,
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        technician: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    await tx.technician.update({
      where: {
        id: technician.id,
      },
      data: {
        status: "BUSY",
      },
    })

    return updatedOutage
  })

  return result
}


const updateOutageStatus = async (
  outageId: string,
  payload: IUpdateOutageStatusPayload
) => {
      const  status  = payload.status


  const outage = await prisma.outage.findFirst({
    where: {
      id: outageId,
      deletedAt: null,
    },
  })

  if (!outage) {
    throw new Error("Outage not found")
  }

  if (
    outage.status === OutageStatus.RESTORED ||
    outage.status === OutageStatus.CANCELLED||
    outage.status === OutageStatus.ASSIGNED ||
    outage.status === OutageStatus.IN_PROGRESS
  ) {
    throw new Error("This outage status cannot be changed")
  }

// console.log(status)

  if (status !== "ACKNOWLEDGED") {
    throw new Error(
      "Power Operator can only set ACKNOWLEDGED status"
    )
  }

  if (outage.status !== "REPORTED") {
    throw new Error(
      "Only REPORTED outage can be acknowledged"
    )
  }

  const result = await prisma.outage.update({
    where: {
      id: outageId,
    },
    data: {
      status: "ACKNOWLEDGED",
    },
    include: {
      zone: true,

      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },

      technician: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  })

  return result




}



const cancelOutage = async (outageId: string) => {
  const outage = await prisma.outage.findFirst({
    where: {
      id: outageId,
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
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        technician: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    })

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

export const OutageService ={
    getAllOutages,
    getSingleOutage,
    assignTechnician,
    updateOutageStatus,
    cancelOutage
}

