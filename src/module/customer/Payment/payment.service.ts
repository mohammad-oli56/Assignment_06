import axios from "axios";
import { PaymentStatus, Provider, ServiceRequestStatus } from "../../../../generated/prisma/enums";
import config from "../../../config";
import { prisma } from "../../../lib/prisma";
import { IPaymentpayload, ItenantDetails, SERVICE_PRICES } from "./payment.interface";
import { getBkashIdToken } from "../../../lib/bkash";



const createPaymentInDB = async (
    userDetails: ItenantDetails,
    payload: IPaymentpayload

) => {

    if (!payload.paymentMethod) {
        throw new Error("Payment method is required")
    }


    if (!payload.requestId) {
        throw new Error("serviceRequestId is required")
    }



    const serviceRequest = await prisma.serviceRequest.findFirst({
        where: {
            id: payload.requestId,
            userId: userDetails.userId,
            deletedAt: null,
        },

        include: {
            payment: true,
        },
    })


    if (!serviceRequest) {
        throw new Error("Service request not found")
    }


    // -----------------------------------------
    // 3. Check Service Request Status
    // -----------------------------------------

    if (serviceRequest.status === ServiceRequestStatus.CANCELLED) {
        throw new Error("Service request is CANCELLED")
    }


    if (serviceRequest.status !== ServiceRequestStatus.CONFIRMED) {
        throw new Error(
            "Service request is not confirmed yet, wait for confirmation"
        )
    }


    // -----------------------------------------
    // 4. Check Existing Payment
    // -----------------------------------------

    const existingPayment = await prisma.payment.findUnique({
        where: {
            serviceRequestId: payload.requestId,
        },
    })


    if (existingPayment) {
        throw new Error(
            "Payment already exists for this service request"
        )
    }


    // -----------------------------------------
    // 5. Calculate Amount
    // -----------------------------------------

    const amount =
        SERVICE_PRICES[
        serviceRequest.type as keyof typeof SERVICE_PRICES
        ]


    if (!amount) {
        throw new Error(
            "Invalid service type or service price not found"
        )
    }


    // -----------------------------------------
    // 6. Validate Payment Method
    // -----------------------------------------




    // =====================================================
    // SSL COMMERZ
    // =====================================================

    if (payload.paymentMethod === Provider.SSLCOMMERZ) {

        const tranId = crypto.randomUUID()


        const paymentData = {
            store_id: config.STORE_ID,
            store_passwd: config.STORE_PASSWORD,

            total_amount: amount,
            currency: "BDT",
            tran_id: tranId,

            product_name: serviceRequest.type,
            product_category: "Electricity Service",
            product_profile: "general",

            success_url:
                `${config.APP_URL}/api/v1/payments/success`,

            fail_url:
                `${config.APP_URL}/api/v1/payments/fail`,

            cancel_url:
                `${config.APP_URL}/api/v1/payments/cancel`,

            cus_name: userDetails.name,
            cus_email: userDetails.email,

            cus_add1: "Dhaka",
            cus_city: "Dhaka",
            cus_country: "Bangladesh",

            ship_name: userDetails.name,
            ship_add1: "Dhaka",
            ship_city: "Dhaka",
            ship_country: "Bangladesh",
        }


        const formData = new URLSearchParams()


        Object.entries(paymentData).forEach(
            ([key, value]) => {
                formData.append(key, String(value))
            }
        )


        const response = await axios.post(
            "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
            formData,
            {
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded",
                },
            }
        )


        if (response.data.status !== "SUCCESS") {
            throw new Error(
                "Failed to create SSLCommerz payment session"
            )
        }


        // -----------------------------------------
        // Save Payment in DB
        // -----------------------------------------

        await prisma.payment.create({
            data: {
                userId: serviceRequest.userId,
                serviceRequestId: serviceRequest.id,
                transactionId: tranId,
                provider: Provider.SSLCOMMERZ,
                amount: amount,
                status: PaymentStatus.PENDING,
            },
        })


        return {
            provider: "SSLCOMMERZ",
            transactionId: tranId,
            amount: amount,
            paymentUrl: response.data.GatewayPageURL,
        }
    }


    // =====================================================
    // bKASH
    // =====================================================

    if (payload.paymentMethod === Provider.BKASH) {

        const bkashIdToken = await getBkashIdToken()


        if (!bkashIdToken) {
            throw new Error(
                "bKash access token not found"
            )
        }


        const tranId = crypto.randomUUID()


        const createPaymentBkash = await fetch(
            `${config.BKASH_BASE_URL}/tokenized/checkout/create`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",

                    authorization: bkashIdToken,

                    "x-app-key":
                        config.BKASH_APP_KEY,
                },

                body: JSON.stringify({
                    mode: "0011",

                    payerReference: userDetails.email,

                    callbackURL:
                        `https://assignment-06-mu.vercel.app/api/v1/customer/payment/bkash/conform`,

                    amount: amount.toString(),

                    currency: "BDT",

                    intent: "sale",

                    merchantInvoiceNumber: tranId,
                }),
            }
        )


        const bkashResponse =
            await createPaymentBkash.json()


        // -----------------------------------------
        // bKash Error Check
        // -----------------------------------------

        if (!createPaymentBkash.ok) {
            throw new Error(
                bkashResponse.statusMessage ||
                "Failed to create bKash payment"
            )
        }


        if (
            bkashResponse.statusCode &&
            bkashResponse.statusCode !== "0000"
        ) {
            throw new Error(
                bkashResponse.statusMessage ||
                "Failed to create bKash payment"
            )
        }


        // -----------------------------------------
        // Save Payment in DB
        // -----------------------------------------

        await prisma.payment.create({
            data: {
                userId: serviceRequest.userId,

                serviceRequestId:
                    serviceRequest.id,

                transactionId: tranId,

                provider: Provider.BKASH,

                amount: amount,

                status: PaymentStatus.PENDING,
            },
        })


        return {
            provider: "BKASH",

            transactionId: tranId,

            paymentId:
                bkashResponse.paymentID,

            amount: amount,

            paymentUrl:
                bkashResponse.bkashURL,
        }
    }



    throw new Error(
        "Unsupported payment provider"
    )
}


const bkashCallback = async (query: Record<string, any>) => {
  const paymentId = query.paymentID
  const status = query.status

//   console.log(paymentId)

  if (!paymentId) {
    throw new Error("paymentID missing")
  }

  if (!status) {
    throw new Error("status missing")
  }

  const bkashIdToken = await getBkashIdToken()

  const executePaymentResponse = await fetch(
    `${config.BKASH_BASE_URL}/tokenized/checkout/execute`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: bkashIdToken,
        "x-app-key": config.BKASH_APP_KEY,
      },
      body: JSON.stringify({
        paymentID: paymentId,
      }),
    }
  )

  if (!executePaymentResponse.ok) {
    throw new Error("bKash payment execution failed")
  }

  const executedPayment = await executePaymentResponse.json()

//   console.log("bKash execute response:", executedPayment)

  // bKash payment failed
  if (status !== "success") {
    throw new Error("bKash payment was not successful")
  }

  // Check bKash response
  if (
    executedPayment.transactionStatus !== "Completed" &&
    executedPayment.statusCode !== "0000"
  ) {
    throw new Error(
      executedPayment.statusMessage || "bKash payment verification failed"
    )
  }

  const transactionId = executedPayment.trxID

  if (!transactionId) {
    throw new Error("bKash transaction ID not found")
  }

  // Update database
  const transactionResult = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: {
        transactionId: executedPayment.merchantInvoiceNumber,
      },
      include: {
        serviceRequest: true,
      },
    })

    if (!payment) {
      throw new Error("Payment record not found")
    }

    // Already paid
    if (payment.status === "PAID") {
      return payment
    }

    // Update payment
    const updatedPayment = await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "PAID",
        transactionId: transactionId,
        paidAt: new Date(),
      },
      include: {
        serviceRequest: true,
      },
    })

    return updatedPayment
  })

  return transactionResult
}







export const PaymentService = {
    createPaymentInDB,
    bkashCallback

}