import bcrypt from "bcryptjs"

import { prisma } from "../../lib/prisma"


import { UserRole, UserStatus } from "../../../generated/prisma/client"
import { ICreateStaffPayload, IGetAllUsersQuery, IUpdateUserStatusPayload } from "./admin.interface"

// ========================================
// Get All Users
// ========================================

const getAllUsers = async (payload: IGetAllUsersQuery) => {
  const page = Number(payload.page) || 1
  const limit = Number(payload.limit) || 10

  const skip = (page - 1) * limit

  const search = payload.search?.trim()
  const role = payload.role
  const status = payload.status

  const where = {
    deletedAt: null,

    ...(search && {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
      ],
    }),

    ...(role && {
      role,
    }),

    ...(status && {
      status,
    }),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        isActive: true,
        emailVerified: true,
        profilePhoto: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.user.count({
      where,
    }),
  ])

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: users,
  }
}

// ========================================
// Create Technician / Power Operator
// ========================================

const createStaff = async (payload: ICreateStaffPayload) => {
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

  const hashedPassword = await bcrypt.hash(password, 10)

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        emailVerified: true,
      },
    })

    let technician = null

    if (role === UserRole.TECHNICIAN) {
      technician = await tx.technician.create({
        data: {
          userId: user.id,
          employeeId: employeeId!,
          specialization,
        },
      })
    }

    return {
      user,
      technician,
    }
  })

  const { password: _, ...userWithoutPassword } = result.user

  return {
    user: userWithoutPassword,
    technician: result.technician,
  }
}

// ========================================
// Update User Status
// ========================================

const updateUserStatus = async (
  id: string,
  payload: IUpdateUserStatusPayload
) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      id,
    },
  })

  if (!existingUser || existingUser.deletedAt) {
    throw new Error("User not found")
  }

  // Admin status change prevent
  if (existingUser.role === UserRole.ADMIN) {
    throw new Error("Admin status cannot be changed")
  }

  const updatedUser = await prisma.user.update({
    where: {
      id,
    },

    data: {
      status: payload.status,
      isActive: payload.status === "ACTIVE",
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return updatedUser
}

// ========================================
// Soft Delete User
// ========================================

const deleteUser = async (id: string) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      id,
    },
  })

  if (!existingUser || existingUser.deletedAt) {
    throw new Error("User not found")
  }

  // Admin delete prevent
  if (existingUser.role === UserRole.ADMIN) {
    throw new Error("Admin cannot be deleted")
  }

  const deletedUser = await prisma.user.update({
    where: {
      id,
    },

    data: {
      deletedAt: new Date(),
      isActive: false,
      status: UserStatus.DELETED,
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      deletedAt: true,
    },
  })

  return deletedUser
}

// ========================================
// Dashboard Stats
// ========================================

const getDashboardStats = async () => {
  const [
    totalUsers,
    totalCustomers,
    totalTechnicians,
    totalPowerOperators,
    activeUsers,
    inactiveUsers,
    totalZones,
    totalOutages,
    activeOutages,
    totalServiceRequests,
    pendingServiceRequests,
    totalPayments,
    paidPayments,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        deletedAt: null,
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
        isActive: true,
        deletedAt: null,
      },
    }),

    prisma.user.count({
      where: {
        isActive: false,
        deletedAt: null,
      },
    }),

    prisma.zone.count({
      where: {
        deletedAt: null,
      },
    }),

    prisma.outage.count({
      where: {
        deletedAt: null,
      },
    }),

    prisma.outage.count({
      where: {
        status: {
          in: ["REPORTED", "ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS"],
        },
        deletedAt: null,
      },
    }),

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

    prisma.payment.count(),

    prisma.payment.count({
      where: {
        status: "PAID",
      },
    }),
  ])

  return {
    users: {
      total: totalUsers,
      customers: totalCustomers,
      technicians: totalTechnicians,
      powerOperators: totalPowerOperators,
      active: activeUsers,
      inactive: inactiveUsers,
    },

    zones: {
      total: totalZones,
    },

    outages: {
      total: totalOutages,
      active: activeOutages,
    },

    serviceRequests: {
      total: totalServiceRequests,
      pending: pendingServiceRequests,
    },

    payments: {
      total: totalPayments,
      paid: paidPayments,
    },
  }
}

// ========================================
// Audit Logs
// ========================================

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
  createStaff,
  updateUserStatus,
  deleteUser,
  getDashboardStats,
  getAuditLogs,
}