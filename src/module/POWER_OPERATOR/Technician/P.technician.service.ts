import { prisma } from "../../../lib/prisma"

const getAllTechnician = async () => {
  const technicians = await prisma.technician.findMany({
    where: {
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
          isActive: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return technicians
}


export const PowerOperatorTechnicianService ={
    getAllTechnician
}