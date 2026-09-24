import axios from "axios";
import { ServiceRequestStatus } from "../../../../generated/prisma/enums";
import config from "../../../config";
import { prisma } from "../../../lib/prisma";
import { ItenantDetails, SERVICE_PRICES } from "./payment.interface";



const createPaymentInDB = async (
    userDetails: ItenantDetails,
    serviceRequestId: string
) => {

  

    // Validate serviceRequestId
    if (!serviceRequestId) {
        throw new Error("serviceRequestId is required");
    }

    const serviceRequest = await prisma.serviceRequest.findFirst({
        where: {
            id: serviceRequestId,
            userId: userDetails.userId,
        },
        include: {
            payment: true,
        },
    });


    

    console.log(serviceRequest)

    if (!serviceRequest) {
        throw new Error("Rental request not found");
    }

    if (serviceRequest.status === ServiceRequestStatus.CANCELLED) {
        throw new Error("Service request is CANCELLED");
    }

    if (serviceRequest.status !== ServiceRequestStatus.CONFIRMED) {
        throw new Error(
            "Service request is not confirmed now, wait for confirmation"
        );
    }

    const existingPayment = await prisma.payment.findUnique({
        where: {
            serviceRequestId: serviceRequestId,
        },
    });

    if (existingPayment) {
        throw new Error("Payment already exists for this rental request");
    }

    const amount = SERVICE_PRICES[serviceRequest.type as keyof typeof SERVICE_PRICES]
   
    const tranId = crypto.randomUUID();


    const paymentData = {
        store_id: config.STORE_ID,
        store_passwd: config.STORE_PASSWORD,

        total_amount: amount,
        currency: "BDT",
        tran_id: tranId,

        product_category: "Rental Property",

        success_url: "http://localhost:5000/api/v1/customer/payment/create",
        fail_url: `${config.APP_URL}/api/payments/fail`,
        cancel_url: `${config.APP_URL}/api/payments/cancel`,

        cus_name: userDetails.name,
        cus_email: userDetails.email,


        cus_add1: "Dhaka",
        cus_city: "Dhaka",
        cus_country: "Bangladesh",

        ship_name: userDetails.name,
        ship_add1: "Dhaka",
        ship_city: "Dhaka",
        ship_country: "Bangladesh",
    };


    //   console.log(paymentData.success_url)

      const formData = new URLSearchParams();

      Object.entries(paymentData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });


      const response = await axios.post(
        "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );


      if (response.data.status !== "SUCCESS") {
        throw new Error("Failed to create payment session");
      }






      await prisma.payment.create({
        data: {
          userId:serviceRequest.userId,
          serviceRequestId:serviceRequest.id,
          transactionId:tranId,
          amount:amount
        },
      });


      return {
        GatewayPageURL: response.data.GatewayPageURL,
      };
};


export const PaymentService = {
    createPaymentInDB
}