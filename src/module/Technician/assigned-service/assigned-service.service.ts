import { prisma } from "../../../lib/prisma"

interface IServiceQuery {
  page?: string
  limit?: string
}

interface IUpdateServiceStatusPayload {
  status: "IN_PROGRESS" | "COMPLETED"
}

const getMyAssignedServices = async (
  userId: string,
  query: IServiceQuery = {}
) => {
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 10
  const skip = (page - 1) * limit

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

  const where = {
    technicianId: technician.id,
    deletedAt: null,
  }

  const [data, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        zone: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payment: true,
      },
    }),

    prisma.serviceRequest.count({
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

const getSingleAssignedService = async (
  userId: string,
  serviceRequestId: string
) => {
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

  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: {
      id: serviceRequestId,
      technicianId: technician.id,
      deletedAt: null,
    },
    include: {
      zone: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      payment: true,
    },
  })

  if (!serviceRequest) {
    throw new Error("Assigned service not found")
  }

  return serviceRequest
}

const updateServiceStatus = async (
  userId: string,
  serviceRequestId: string,
  payload: IUpdateServiceStatusPayload
) => {
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

  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: {
      id: serviceRequestId,
      technicianId: technician.id,
      deletedAt: null,
    },
  })

  if (!serviceRequest) {
    throw new Error("Assigned service not found")
  }

  const { status } = payload

  if (
    status !== "IN_PROGRESS" &&
    status !== "COMPLETED"
  ) {
    throw new Error(
      "Technician can only set IN_PROGRESS or COMPLETED"
    )
  }

  if (
    status === "IN_PROGRESS" &&
    serviceRequest.status !== "CONFIRMED"
  ) {
    throw new Error(
      "Only CONFIRMED service request can be started"
    )
  }

  if (
    status === "COMPLETED" &&
    serviceRequest.status !== "IN_PROGRESS"
  ) {
    throw new Error(
      "Only IN_PROGRESS service request can be completed"
    )
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedServiceRequest =
      await tx.serviceRequest.update({
        where: {
          id: serviceRequestId,
        },
        data: {
          status,
        },
        include: {
          zone: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          payment: true,
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

    if (status === "COMPLETED") {
      await tx.technician.update({
        where: {
          id: technician.id,
        },
        data: {
          status: "AVAILABLE",
        },
      })
    }

    return updatedServiceRequest
  })

  return result
}

export const AssignedServiceService = {
  getMyAssignedServices,
  getSingleAssignedService,
  updateServiceStatus,
}