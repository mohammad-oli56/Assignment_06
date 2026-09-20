import { prisma } from "../../../lib/prisma"
import { ICreateZonePayload } from "./zone.interface"


const creatZone = async (payload: ICreateZonePayload) => {
    
  const existingZone = await prisma.zone.findFirst({
    where: {
      code: payload.code,
      deletedAt: null,
    },
  })

  if (existingZone) {
    throw new Error("Zone with this code already exists")
  }

  const zone = await prisma.zone.create({
    data: {
      name: payload.name,
      code: payload.code,
      substation: payload.substation,
      feeder: payload.feeder,
      area: payload.area,
      location: payload.location,
    },
  })

  return zone
}

const getAllZone = async () => {
  const zones = await prisma.zone.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return zones
}

export const ZoneService = {
  creatZone,
  getAllZone,
}