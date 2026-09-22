import { prisma } from "../../../lib/prisma"
import { ICreateServiceRequestPayload, IServiceRequestQuery } from "./service_request.interface"




const createServiceRequest = async (
  userId: string,
  payload: ICreateServiceRequestPayload
) => {
  const {
    zoneId,
    type,
    description,
  } = payload

  // 1. Check zone
  const zone = await prisma.zone.findFirst({
    where: {
      id: zoneId,
      deletedAt: null,
    },
  })

  if (!zone) {
    throw new Error("Zone not found")
  }

  // 2. Get customer account number
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
    },
    select: {
      accountNumber: true,
    },
  })

  if (!user) {
    throw new Error("User not found")
  }

  if (!user.accountNumber) {
    throw new Error("Customer account number not found")
  }

  // 3. Check existing active service request
  const existingRequest = await prisma.serviceRequest.findFirst({
    where: {
      userId,
      accountNumber: user.accountNumber,
      type,
      deletedAt: null,
      status: {
        in: [
          "PENDING",
          "CONFIRMED",
          "IN_PROGRESS",
        ],
      },
    },
  })

  if (existingRequest) {
    throw new Error(
      "You already have an active request for this service"
    )
  }

  // 4. Create service request
  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      userId,
      zoneId,
      accountNumber: user.accountNumber,
      type,
      description,
      status: "PENDING",
    },
    include: {
      zone: true,
    },
  })

  return serviceRequest
}


const getMyServiceRequests = async (
  userId: string,
  query: IServiceRequestQuery = {}
) => {
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 10
  const skip = (page - 1) * limit

  const where: any = {
    userId,
    deletedAt: null,
  }

  if (query.status) {
    where.status = query.status
  }

  if (query.type) {
    where.type = query.type
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
  userId: string,
  serviceRequestId: string
) => {
  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: {
      id: serviceRequestId,
      userId,
      deletedAt: null,
    },
    include: {
      zone: true,
      payment: true,
    },
  })

  if (!serviceRequest) {
    throw new Error("Service request not found")
  }

  return serviceRequest
}

const cancelServiceRequest = async (
  userId: string,
  serviceRequestId: string
) => {
  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: {
      id: serviceRequestId,
      userId,
      deletedAt: null,
    },
      include: {
    payment: true,
  },
  })

  if (!serviceRequest) {
    throw new Error("Service request not found")
  }

  // Cannot cancel completed or already cancelled request
  if (
    serviceRequest.status === "COMPLETED" ||
    serviceRequest.status === "CANCELLED" ||
    serviceRequest.status === "IN_PROGRESS"
  ) {
    throw new Error(
      "This service request cannot be cancelled"
    )
  }

   // Payment already completed
  if (serviceRequest.payment?.status === "PAID") {
    throw new Error(
      "Paid service request cannot be cancelled"
    )
  }

  const result = await prisma.serviceRequest.update({
    where: {
      id: serviceRequestId,
    },
    data: {
      status: "CANCELLED",
    },
    include: {
      zone: true,
      payment: true,
    },
  })

  return result
}



export const ServiceRequestService = {
    createServiceRequest,
    getSingleServiceRequest,
    getMyServiceRequests,
    cancelServiceRequest
}


