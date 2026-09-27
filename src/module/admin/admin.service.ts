import bcrypt from "bcryptjs"
import { prisma } from "../../lib/prisma"
import { Prisma, UserRole, UserStatus } from "../../../generated/prisma/client"
import { IAmin, ICreateStaffPayload, IGetAllUsersQuery, IUpdateUserStatusPayload } from "./admin.interface"



const getAllUsers = async (query: IGetAllUsersQuery) => {
  const {
    page,
    limit,
    name,
    status,
  } = query;

  // Pagination
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;

  const skip = (pageNumber - 1) * limitNumber;

  // Only CUSTOMER users
  const where: Prisma.UserWhereInput = {
    // role: UserRole.CUSTOMER,
  };

  // Name search
  if (name) {
    where.name = {
      contains: name,
      mode: "insensitive",
    };
  }

  // Status filter
  if (status) {
    where.status = status;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limitNumber,
      orderBy: {
        createdAt: "desc",
      },
      omit: {
        password: true
      }
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    data: users,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};




const getSingleuser = async (
  userId: string,
) => {
  // console.log(userId)
  const singleuser = await prisma.user.findUnique({
    where: {
      id: userId,
      deletedAt:null
    },
    omit: {
      password: true
    }
  })
  if (!singleuser) {
    throw new Error("user not found")
  }
  // console.log(singleuser)
  return singleuser
}


const updateUserStatus = async (
  adminUserId: IAmin,
  id: string,
  payload: UserStatus
) => {
  console.log("Admin:", adminUserId)
  console.log("Target User:", id)
  console.log("Payload:", payload)

  const existingUser = await prisma.user.findFirst({
    where: {
      id,
      deletedAt:null
    },
  })

  if (!existingUser) {
    throw new Error("User not found")
  }

  // Admin status change prevent
  if (existingUser.role === UserRole.ADMIN) {
    throw new Error("Admin status cannot be changed")
  }

  // Same status prevent
  if (existingUser.status === payload) {
    throw new Error(`User is already ${payload}`)
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    console.log("inside transaction", payload)
    const user = await tx.user.update({

      where: {
        id: existingUser.id,
      },
      data: {
        status: payload,

      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await tx.auditLog.create({
      data: {
        userId: adminUserId.userId,
        author_role: adminUserId.role,
        action: "UPDATE_USER_STATUS",
        entityType: "USER",
        entityId: existingUser.id,
      },
    })

    return user
  })

  return updatedUser
}


const createStaff = async (
  adminUserId: IAmin,
  payload: ICreateStaffPayload
) => {
  const {
    name,
    email,
    password,
    phone,
    role,
    employeeId,
    specialization,
  } = payload

  // Extra backend protection
  if (
    role !== UserRole.TECHNICIAN &&
    role !== UserRole.POWER_OPERATOR
  ) {
    throw new Error(
      "Only Technician or Power Operator can be created by Admin"
    )
  }

  // Check existing email
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  })

  if (existingUser) {
    throw new Error("User with this email already exists")
  }

  // Technician must have employeeId
  if (role === UserRole.TECHNICIAN && !employeeId) {
    throw new Error("Employee ID is required for Technician")
  }

  // Power Operator should not have Technician fields
  if (
    role === UserRole.POWER_OPERATOR &&
    (employeeId || specialization)
  ) {
    throw new Error(
      "Employee ID and specialization are only for Technician"
    )
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const result = await prisma.$transaction(async (tx) => {
    // Create User
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        emailVerified: true,
      },
      omit: {
        password: true,
      },
    })

    let technician = null

    // Create Technician profile
    if (role === UserRole.TECHNICIAN) {
      technician = await tx.technician.create({
        data: {
          userId: user.id,
          employeeId: employeeId!,
          specialization,
        },
      })
    }

    // Create Audit Log
    await tx.auditLog.create({
      data: {
        userId: adminUserId.userId,
        author_role:adminUserId.role,
         action:
          role === UserRole.TECHNICIAN
            ? "CREATE_TECHNICIAN"
            : "CREATE_POWER_OPERATOR",
        entityType: "USER",
        entityId: user.id,
      },
    })

    return {
      user,
      technician,
    }
  })

  return result
}


const deleteUser = async (
  adminUserId: IAmin,
  id: string
) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      id,
     deletedAt:null
    },
  })

  if (!existingUser) {
    throw new Error("User not found")
  }

  // Admin delete prevent
  if (existingUser.role === UserRole.ADMIN) {
    throw new Error("Admin cannot be deleted")
  }

  const deletedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        status:"DELETED",
        isActive:false,
        deletedAt: new Date(),
      },
     omit:{
      password:true
     }
    })

    await tx.auditLog.create({
      data: {
        userId: adminUserId.userId,
        author_role:adminUserId.role,
        action: "DELETE_USER",
        entityType: "USER",
        entityId: existingUser.id,
      },
    })

    return user
  })

  return deletedUser
}


const getDashboardStats = async () => {
  const [
    totalUsers,
    deletedUsers,
    customers,
    technicians,
    powerOperators,
    activeUsers,
    blockedUsers,

    totalOutages,
    reportedOutages,
    assignedOutages,
    inProgressOutages,
    restoredOutages,

    totalServiceRequests,
    pendingRequests,
    confirmedRequests,
    inProgressRequests,
    completedRequests,

    totalPayments,
    paidPayments,
    pendingPayments,
    failedPayments,
  ] = await Promise.all([
    // ================= USER =================

    // Only active/non-deleted users
    prisma.user.count({
      where: {
        deletedAt: null,
      },
    }),

    // Deleted users
    prisma.user.count({
      where: {
        deletedAt: {
          not: null,
        },
      },
    }),

    prisma.user.count({
      where: {
        role: UserRole.CUSTOMER,
        deletedAt: null,
      },
    }),

    prisma.user.count({
      where: {
        role: UserRole.TECHNICIAN,
        deletedAt: null,
      },
    }),

    prisma.user.count({
      where: {
        role: UserRole.POWER_OPERATOR,
        deletedAt: null,
      },
    }),

   prisma.user.count({
    where: {
      status: UserStatus.ACTIVE,
      deletedAt: null,
    },
  }),

  prisma.user.count({
    where: {
      status: UserStatus.BLOCKED,
      deletedAt: null,
    },
  }),
    // ================= OUTAGE =================

    prisma.outage.count({
      where: {
        deletedAt: null,
      },
    }),

    prisma.outage.count({
      where: {
        status: "REPORTED",
        deletedAt: null,
      },
    }),

    prisma.outage.count({
      where: {
        status: "ASSIGNED",
        deletedAt: null,
      },
    }),

    prisma.outage.count({
      where: {
        status: "IN_PROGRESS",
        deletedAt: null,
      },
    }),

    prisma.outage.count({
      where: {
        status: "RESTORED",
        deletedAt: null,
      },
    }),

    // ================= SERVICE REQUEST =================

    prisma.serviceRequest.count({
      where: {
        deletedAt: null,
      },
    }),

    prisma.serviceRequest.count({
      where: {
        status: "PENDING",
        deletedAt: null,
      },
    }),

    prisma.serviceRequest.count({
      where: {
        status: "CONFIRMED",
        deletedAt: null,
      },
    }),

    prisma.serviceRequest.count({
      where: {
        status: "IN_PROGRESS",
        deletedAt: null,
      },
    }),

    prisma.serviceRequest.count({
      where: {
        status: "COMPLETED",
        deletedAt: null,
      },
    }),

    // ================= PAYMENT =================

    prisma.payment.count(),

    prisma.payment.count({
      where: {
        status: "PAID",
      },
    }),

    prisma.payment.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.payment.count({
      where: {
        status: "FAILED",
      },
    }),
  ])

  return {
    users: {
      total: totalUsers,
      deleted: deletedUsers,
      customers,
      technicians,
      powerOperators,
      active: activeUsers,
      blocked: blockedUsers,
    },

    outages: {
      total: totalOutages,
      reported: reportedOutages,
      assigned: assignedOutages,
      inProgress: inProgressOutages,
      restored: restoredOutages,
    },

    serviceRequests: {
      total: totalServiceRequests,
      pending: pendingRequests,
      confirmed: confirmedRequests,
      inProgress: inProgressRequests,
      completed: completedRequests,
    },

    payments: {
      total: totalPayments,
      paid: paidPayments,
      pending: pendingPayments,
      failed: failedPayments,
    },
  }
}



const getAuditLogs = async (payload: IGetAllUsersQuery) => {
  const page = Number(payload.page) || 1
  const limit = Number(payload.limit) || 10

  const skip = (page - 1) * limit

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: limit,

      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.auditLog.count(),
  ])

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },

    data: logs,
  }
}

export const AdminService = {
  getAllUsers,
  getSingleuser,
  createStaff,
  updateUserStatus,
  deleteUser,
  getDashboardStats,
  getAuditLogs,
}