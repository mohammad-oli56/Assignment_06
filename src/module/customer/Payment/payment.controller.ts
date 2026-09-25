import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";

import { PaymentService } from "./payment.service";
import { ItenantDetails } from "./payment.interface";


const paymentCreate = catchAsync(async (req: Request, res: Response) => {
 
    if(!req.user){
        throw new Error("user not found")
    }



    const result = await PaymentService.createPaymentInDB(
        req.user,
        req.body,

    );

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "payment create",
        data: result
    })


})


const paymentconfirmbkash = catchAsync(
  async (req: Request, res: Response) => {
   const result = await PaymentService.bkashCallback(req.query)

   sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "payment create",
        data: result
    })
  }
)

   // await PaymentService.paymentConfirmInDB(req.body);

    // return res.redirect(
    //   "https://assignment-05-theta.vercel.app/tenant-dashboard/payment/success"
    // );

const paymentfail = async (req:Request,res:Response)=>{
    // await PaymentService.paymentFailInDB(req.body);
     return res.redirect(
      "https://assignment-05-theta.vercel.app/tenant-dashboard/payment/cancel"
    );
}


const paymentHistory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
   


    // const result = await PaymentService.getAllPaymentHistoryDB(req.user?.id as string,);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "all Payment History",
        data: null
    })


})


const paymentDetails = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    // console.log(req.params.id)
    // console.log(req.user?.id)

    //  const result = await PaymentService.getSinglePaymentDetails( req.params.id as string,req.user?.id as string);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "all Payment History",
        data: null
    })

})

export const PaymentController = {
    paymentCreate,
    paymentconfirmbkash,
    paymentHistory,
    paymentDetails,
    paymentfail
}

