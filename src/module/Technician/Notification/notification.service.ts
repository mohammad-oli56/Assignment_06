
import { prisma } from "../../../lib/prisma"

const getNotification = async (userId: string) => {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return notifications
}

export const NotificationServiceTECHNICIAN = {
  getNotification,
}

