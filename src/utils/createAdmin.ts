import bcrypt from "bcryptjs"
import { prisma } from "../lib/prisma"
import config from "../config"

export const createAdmin = async () => {
  const adminEmail = config.ADMIN_EMAIL as string
  const adminPassword = config.ADMIN_PASS as string

  // Check if an active Admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {   
    email:adminEmail
    },
  })

  if (existingAdmin) {
    console.log("Admin already exists")
    return
  }

  // Hash admin password
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  // Create Admin
  await prisma.user.create({
    data: {
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      phone: "01700000000",
      emailVerified: true,
    },
  })

  console.log("Admin created successfully")
}