import { ServiceRequestStatus } from "../../../../generated/prisma/enums"
import { prisma } from "../../../lib/prisma"

interface IServiceRequestQuery {
  page?: string
  limit?: string
  search?: string
  status?: string
  zoneId?: string
}

interface IUpdateServiceRequestStatusPayload {
  status: ServiceRequestStatus
}



const getAllServiceRequests = async (
  query: IServiceRequestQuery = {}
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

  if (query.search) {
    where.OR = [
      {
        type: {
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
      {
        accountNumber: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        user: {
          name: {
            contains: query.search,
            mode: "insensitive",
          },
        },
      },
      {
        user: {
          email: {
            contains: query.search,
            mode: "insensitive",
          },
        },
      },
    ]
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
            accountNumber: true,
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



const getSingleServiceRequest = async (
  serviceRequestId: string
) => {
  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: {
      id: serviceRequestId,
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
          accountNumber: true,
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

      payment: true,
    },
  })

  if (!serviceRequest) {
    throw new Error("Service request not found")
  }

  return serviceRequest
}



const updateServiceRequestStatus = async (
  userId: string,
  serviceRequestId: string,
  payload: IUpdateServiceRequestStatusPayload
) => {
  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: {
      id: serviceRequestId,
      deletedAt: null,
    },
  })

  if (!serviceRequest) {
    throw new Error("Service request not found")
  }

  const { status } = payload

  if (status !== "CONFIRMED") {
    throw new Error(
      "Power Operator can only set CONFIRMED status"
    )
  }

  if (serviceRequest.status !== "PENDING") {
    throw new Error(
      "Only PENDING service request can be confirmed"
    )
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedServiceRequest =
      await tx.serviceRequest.update({
        where: {
          id: serviceRequestId,
        },

        data: {
          status: "CONFIRMED",
        },

        include: {
          zone: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              accountNumber: true,
            },
          },

          payment: true,
        },
      })

    // Customer notification
    await tx.notification.create({
      data: {
        userId: serviceRequest.userId,
        title: "Service Request Confirmed",
        message:
          "Your service request has been confirmed by the Power Operator.",
        // type: "SERVICE_REQUEST",
      },
    })

    // Audit log
    await tx.auditLog.create({
      data: {
        userId,
        author_role: "POWER_OPERATOR",
        action: "CONFIRM_SERVICE_REQUEST",
        entityType: "SERVICE_REQUEST",
        entityId: serviceRequestId,
      },
    })

    return updatedServiceRequest
  })

  return result
}



const assignTechnician = async (
  userId: string,
  serviceRequestId: string,
  technicianId: string
) => {
  if (!technicianId) {
    throw new Error("Technician ID is required")
  }

  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: {
      id: serviceRequestId,
      deletedAt: null,
    },
    include: {
      payment: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      zone: true,
    },
  })

  if (!serviceRequest) {
    throw new Error("Service request not found")
  }

  // Only CONFIRMED request can be assigned
  if (serviceRequest.status !== "CONFIRMED") {
    throw new Error(
      "Only CONFIRMED service request can be assigned"
    )
  }

  // Payment must exist
  if (!serviceRequest.payment) {
    throw new Error(
      "Payment is required before assigning a technician"
    )
  }

  // Payment must be PAID
  if (serviceRequest.payment.status !== "PAID") {
    throw new Error(
      "Payment must be completed before assigning a technician"
    )
  }

  // Store payment amount before transaction
  const paymentAmount = serviceRequest.payment.amount

  // Prevent multiple technician assignment
  if (serviceRequest.technicianId) {
    throw new Error(
      "A technician is already assigned to this service request"
    )
  }

  // Find available technician
  const technician = await prisma.technician.findFirst({
    where: {
      id: technicianId,
      status: "AVAILABLE",
      user: {
        role: "TECHNICIAN",
        isActive: true,
        deletedAt: null,
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
    throw new Error("Available technician not found")
  }

  const result = await prisma.$transaction(async (tx) => {
    // Assign technician
    const updatedServiceRequest =
      await tx.serviceRequest.update({
        where: {
          id: serviceRequestId,
        },

        data: {
          technicianId: technician.id,
        },

        include: {
          zone: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              accountNumber: true,
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

          payment: true,
        },
      })

    // Technician becomes BUSY
    await tx.technician.update({
      where: {
        id: technician.id,
      },

      data: {
        status: "BUSY",
      },
    })

    // Technician notification
    await tx.notification.create({
      data: {
        userId: technician.user.id,
        title: "New Service Request Assigned",
        message: `New service request assigned.

Service Request ID: ${serviceRequestId}
Amount: ${paymentAmount}
Customer: ${serviceRequest.user.name}
Phone: ${serviceRequest.user.phone ?? "N/A"}
Zone: ${serviceRequest.zone.name}

Please check the service request details.`,
      },
    })

    // Audit log
    await tx.auditLog.create({
      data: {
        userId,
        author_role: "POWER_OPERATOR",
        action: "ASSIGN_TECHNICIAN_SERVICE",
        entityType: "SERVICE_REQUEST",
        entityId: serviceRequestId,
      },
    })

    return updatedServiceRequest
  })

  return result
}


const cancelServiceRequest = async (
  userId: string,
  serviceRequestId: string
) => {
  const serviceRequest =
    await prisma.serviceRequest.findFirst({
      where: {
        id: serviceRequestId,
        deletedAt: null,
      },

      include: {
        payment: true,
      },
    })

  if (!serviceRequest) {
    throw new Error("Service request not found")
  }

  /*
  |-------------------------------------------------------------------------- 
  | Already completed/cancelled
  |-------------------------------------------------------------------------- 
  */

  if (
    serviceRequest.status === "COMPLETED" ||
    serviceRequest.status === "CANCELLED"
  ) {
    throw new Error(
      "This service request cannot be cancelled"
    )
  }

  /*
  |-------------------------------------------------------------------------- 
  | Work already started
  |-------------------------------------------------------------------------- 
  */

  if (serviceRequest.status === "IN_PROGRESS") {
    throw new Error(
      "Service request is already in progress"
    )
  }

  /*
  |-------------------------------------------------------------------------- 
  | Paid request
  |-------------------------------------------------------------------------- 
  */

  if (serviceRequest.payment?.status === "PAID") {
    throw new Error(
      "Paid service request cannot be cancelled"
    )
  }

  /*
  |-------------------------------------------------------------------------- 
  | Cancel + Audit Log
  |-------------------------------------------------------------------------- 
  */

  const result = await prisma.$transaction(async (tx) => {
    const updatedServiceRequest =
      await tx.serviceRequest.update({
        where: {
          id: serviceRequestId,
        },

        data: {
          status: "CANCELLED",
        },

        include: {
          zone: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              accountNumber: true,
            },
          },

          payment: true,
        },
      })

    // Audit Log
    await tx.auditLog.create({
      data: {
        userId,
        author_role: "POWER_OPERATOR",
        action: "CANCEL_SERVICE_REQUEST",
        entityType: "SERVICE_REQUEST",
        entityId: serviceRequestId,
      },
    })

    return updatedServiceRequest
  })

  return result
}



export const ServiceRequestService = {
  getAllServiceRequests,
  getSingleServiceRequest,
  updateServiceRequestStatus,
  assignTechnician,
  cancelServiceRequest,
}