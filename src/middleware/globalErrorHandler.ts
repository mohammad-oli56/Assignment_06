
import type { NextFunction, Request, Response } from "express"
import { Prisma } from "../../generated/prisma/client"

import config from "../config"
import { AppError } from "../utils/AppError"

export const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (config.node_env === "development") {
    console.log("Error from Global Error Handler:", err)
  }

  let statusCode = 500
  let message = "Internal Server Error"
  let errors: unknown[] = []

  // App Error
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message

    errors = [
      {
        message: err.message,
      },
    ]
  }

  // Prisma Validation Error
  else if (
    err instanceof Prisma.PrismaClientValidationError
  ) {
    statusCode = 400
    message = "Invalid data provided"

    errors = [
      {
        message:
          "You have provided incorrect field type or missing fields",
      },
    ]
  }

  // Prisma Known Request Error
  else if (
    err instanceof Prisma.PrismaClientKnownRequestError
  ) {
    if (err.code === "P2002") {
      statusCode = 409
      message = "Duplicate record found"

      errors = [
        {
          message: "A record with this value already exists",
        },
      ]
    }

    else if (err.code === "P2003") {
      statusCode = 400
      message = "Foreign key constraint failed"

      errors = [
        {
          message:
            "The related record does not exist or cannot be deleted",
        },
      ]
    }

    else if (err.code === "P2025") {
      statusCode = 404
      message = "Record not found"

      errors = [
        {
          message: "The requested record was not found",
        },
      ]
    }

    else {
      statusCode = 400
      message = "Database operation failed"

      errors = [
        {
          message:
            "An error occurred while processing the database request",
        },
      ]
    }
  }

  // Prisma Initialization Error
  else if (
    err instanceof Prisma.PrismaClientInitializationError
  ) {
    if (err.errorCode === "P1000") {
      statusCode = 401
      message = "Database authentication failed"
    }

    else if (err.errorCode === "P1001") {
      statusCode = 503
      message = "Cannot reach database server"
    }

    else {
      statusCode = 500
      message = "Database initialization failed"
    }

    errors = [
      {
        message,
      },
    ]
  }

  // Prisma Unknown Request Error
  else if (
    err instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    statusCode = 500
    message = "Database query execution failed"

    errors = [
      {
        message:
          "An unknown error occurred during database query execution",
      },
    ]
  }

  // Normal JavaScript Error
  else if (err instanceof Error) {
    statusCode = 400
    message = err.message

    errors = [
      {
        message: err.message,
      },
    ]
  }

  // Unknown Error
  else {
    statusCode = 500
    message = "Internal Server Error"

    errors = [
      {
        message: "Something went wrong",
      },
    ]
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,

    ...(config.node_env === "development" && {
      stack: err instanceof Error ? err.stack : undefined,
    }),
  })
}

