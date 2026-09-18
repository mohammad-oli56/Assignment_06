import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AuthService } from "./auth.service";
import { IRequestUser } from "./auth.interface";

const registeruser = catchAsync(async (req: Request, res: Response) =>{
      const payload = req.body

    //   console.log(payload)
    const result = await AuthService.registerUser(payload)


    // const { accessToken, refreshToken, createdUser} = result

    // res.cookie("accessToken", accessToken, {
    //     httpOnly: true,
    //     secure: false,
    //     sameSite: "none",
    //     maxAge: 1000 * 60 * 60 * 24 // 24 hour or 1 day
    // })
    // res.cookie("refreshToken", refreshToken, {
    //     httpOnly: true,
    //     secure: false,
    //     sameSite: "none",
    //     maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    // })

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'user registered successfully',
        data:null
        //  {
        //     accessToken,
        //     refreshToken,
        //    createdUser
        // },
    })
})

const verifyuseraccout = catchAsync(async (req: Request, res: Response) =>{
    const payload = req.body

    const result = await AuthService.verifyuseraccout(payload)


    const { accessToken, refreshToken, createdUser} = result

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 // 24 hour or 1 day
    })
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    })

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'user registered successfully',
        data:
         {
            accessToken,
            refreshToken,
           createdUser
        },
    })
})

const loginUser = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body
    const result = await AuthService.loginUser(payload)
    const { accessToken, refreshToken } = result

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 // 24 hour or 1 day
    })
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    })

    sendResponse(res, {
        statusCode:200,
        success: true,
        message: 'User logged in successfully',
        data: {
            accessToken,
            refreshToken
        },
    })
})

const getMe = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as unknown as IRequestUser

    if (!user) {
        throw new Error('User information is missing in the request')
    }

    const result = await AuthService.getMe(user)
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'User profile fetched successfully',
        data: result,
    })
})


const refreshToken = catchAsync(async (req: Request, res: Response) => {
    if (!req.cookies.refreshToken) {
        throw new Error('Refresh token is missing')
    }
    const result = await AuthService.refreshToken(req.cookies.refreshToken)
    const { accessToken, refreshToken: newRefreshToken } = result

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 // 24 hour or 1 day
    })
    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    })

    sendResponse(res, {
        statusCode:200,
        success: true,
        message: 'New tokens generated successfully',
        data: {
            accessToken,
            refreshToken: newRefreshToken,
        },
    })
})

const googlelogin = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body

  const result = await AuthService.googlelogin(payload)

     const { accessToken, refreshToken } = result

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 // 24 hour or 1 day
    })
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    })

    sendResponse(res, {
        statusCode:200,
        success: true,
        message: 'User logged in successfully',
        data: {
            accessToken,
            refreshToken
        },
    })
})


const forgotpassword = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body
     await AuthService.forgotPassword(payload)
   


    sendResponse(res, {
        statusCode:200,
        success: true,
        message: 'otp send ',
        data: null
    })
})



const resetpassword = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body
     await AuthService.resetPassword(payload)
   


    sendResponse(res, {
        statusCode:200,
        success: true,
        message: 'password change successfully',
        data: null
    })
})

export const AuthController = {
    registeruser,
    loginUser,
    getMe,
    refreshToken,
    googlelogin,
    forgotpassword,
    resetpassword,
    verifyuseraccout
}