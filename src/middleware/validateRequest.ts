import { NextFunction, Request, Response } from "express";
import z from "zod";
import { catchAsync } from "../utils/catchAsync";

export const validateRequest = (zodSchema: z.ZodObject) => {
    return catchAsync(
        (req: Request, res: Response, next: NextFunction) => {


            // const payload = req.body ? req.body : {}
            const payload = req.body ?? {}

            const result = zodSchema.safeParse(payload);

            if (!result.success) {
                console.log(result.error);
                console.log(result.error.issues);

                
            }

            req.body = result.data

            next()

        }
    )
}