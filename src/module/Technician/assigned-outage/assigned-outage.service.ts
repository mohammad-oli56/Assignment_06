import { prisma } from "../../../lib/prisma"

interface IOutageQuery {
  page?: string
  limit?: string
}

interface IUpdateOutageStatusPayload {
  status: "IN_PROGRESS" | "RESTORED"
}

const getTechnician = async (userId: string) => {
  const technician = await prisma.technician.findFirst({
    where: {
      userId,
      user: {
        role: "TECHNICIAN",
        isActive: true,
        deletedAt: null,
      },
    },
  })

  if (!technician) {
    throw new Error("Technician not found")
  }

  return technician
}

const getMyAssignedOutages = async (
  userId: string,
  query: IOutageQuery = {}
) => {
  const technician = await getTechnician(userId)

  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 10
  const skip = (page - 1) * limit

  const where = {
    technicianId: technician.id,
    deletedAt: null,
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

const getSingleAssignedOutage = async (
  userId: string,
  outageId: string
) => {
  const technician = await getTechnician(userId)

  const outage = await prisma.outage.findFirst({
    where: {
      id: outageId,
      technicianId: technician.id,
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
    throw new Error("Assigned outage not found")
  }

  return outage
}

const updateOutageStatus = async (
  userId: string,
  outageId: string,
  payload: IUpdateOutageStatusPayload
) => {
  const technician = await getTechnician(userId)

  const outage = await prisma.outage.findFirst({
    where: {
      id: outageId,
      technicianId: technician.id,
      deletedAt: null,
    },
  })

  if (!outage) {
    throw new Error("Assigned outage not found")
  }

  const { status } = payload

  if (
    status !== "IN_PROGRESS" &&
    status !== "RESTORED"
  ) {
    throw new Error(
      "Technician can only set IN_PROGRESS or RESTORED"
    )
  }

  if (
    status === "IN_PROGRESS" &&
    outage.status !== "ASSIGNED"
  ) {
    throw new Error(
      "Only ASSIGNED outage can be started"
    )
  }

  if (
    status === "RESTORED" &&
    outage.status !== "IN_PROGRESS"
  ) {
    throw new Error(
      "Only IN_PROGRESS outage can be restored"
    )
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedOutage = await tx.outage.update({
      where: {
        id: outageId,
      },
      data: {
        status,
        ...(status === "RESTORED"
          ? {
              restoredAt: new Date(),
            }
          : {}),
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

    if (status === "IN_PROGRESS") {
      await tx.technician.update({
        where: {
          id: technician.id,
        },
        data: {
          status: "BUSY",
        },
      })
    }

    if (status === "RESTORED") {
      await tx.technician.update({
        where: {
          id: technician.id,
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

export const AssignedOutageService = {
  getMyAssignedOutages,
  getSingleAssignedOutage,
  updateOutageStatus,
}