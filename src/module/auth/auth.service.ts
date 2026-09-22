import bcrypt from "bcryptjs"
import { JwtPayload, SignOptions } from 'jsonwebtoken'
import { jwtUtils } from "../../utils/jwt"
import { prisma } from "../../lib/prisma"
import { IForgotpassword, IGoogle, ILoginUserPayload, IRegisterUserPayload, IRequestUser, IResetpassword, IverifyUserPayload } from "./auth.interface"
import config from "../../config"
import { authProvider, UserRole, UserStatus } from "../../../generated/prisma/enums"
import { OAuth2Client, TokenPayload } from "google-auth-library"
import { googleClient } from "../../lib/googleauth"
import { error } from "node:console"
import { email } from "zod"
import crypto from 'crypto';
import { Redisclient } from "../../lib/redis"
import { transporter } from "../../lib/nodemailer"
import fs from "fs";
import path from "path";




const registerUser = async (payload: IRegisterUserPayload) => {
    const { name, password, phone } = payload
    const email = payload.email.trim().toLowerCase()

    // Check existing user
    const isUserExists = await prisma.user.findUnique({
        where: { email },
    })

    if (isUserExists) {
        throw new Error("User with this email already exists")
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, Number(config.BCRYPT_SALT_ROUNDS));




    const otp = crypto.randomInt(100000, 1000000);
    const otpkey = `user-register-otp:${email}`;

    // Save OTP for 5 minutes
    await Redisclient.set(otpkey, otp, {
        expiration: {
            type: "EX",
            value: 5 * 60,
        },
    });



    const userdatakey = `user-register-data:${email}`;
    const redisUserData = {
        name,
        email,
        password: hashedPassword,
        phone
    }

    await Redisclient.set(userdatakey, JSON.stringify(redisUserData), {
        expiration: {
            type: "EX",
            value: 5 * 60,
        },
    })

    const templatePath = path.join(
        process.cwd(),
        "src",
        "templates",
        "emails",
        "verify-email.html"
    );

    let html = fs.readFileSync(templatePath, "utf-8");

    html = html.replace("{{name}}", name || "User");
    html = html.replace("{{otp}}", String(otp));

    await transporter.sendMail({
        from: config.SMTP_USER,
        to: email,
        subject: "Verify Your Email",
        html,
    });



}

const verifyuseraccout = async (payload: IverifyUserPayload) => {
    const otp = payload.otp;
    const email = payload.email.trim().toLowerCase();

    // Check existing user
    const isUserExists = await prisma.user.findUnique({
        where: { email },
    });

    if (isUserExists && isUserExists.emailVerified === true) {
        throw new Error("User with this email is already verified");
    }

    // Get OTP
    const otpKey = `user-register-otp:${email}`;
    const redisOTP = await Redisclient.get(otpKey);

    if (!redisOTP) {
        throw new Error("OTP not found or expired");
    }

    if (String(redisOTP) !== String(otp)) {
        throw new Error("OTP does not match");
    }

    // Get user data
    const userDataKey = `user-register-data:${email}`;
    const redisData = await Redisclient.get(userDataKey);

    if (!redisData) {
        throw new Error("User registration data not found or expired");
    }

    const userData = JSON.parse(redisData);


    const accountNumber = `ACC-${crypto.randomUUID()}`


    // Create user
    const createdUser = await prisma.user.create({
        data: {
            name: userData.name,
            email: userData.email,
            password: userData.password,
            phone: userData.phone,
            role: "CUSTOMER",
            accountNumber,
            emailVerified: true,
        },
        omit: {
            password: true,
        },
    });

    // JWT payload
    const jwtPayload = {
        userId: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
    };

    // Access token
    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.JWT_ACCESS_SECRET,
        config.JWT_EXPIRES_IN as SignOptions
    );

    // Refresh token
    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_refresh_secret,
        config.jwt_refresh_expires_in as SignOptions
    );

    // Delete OTP and temporary user data
    await Redisclient.del(otpKey);
    await Redisclient.del(userDataKey);

    return {
        createdUser,
        accessToken,
        refreshToken,
    };
};


const loginUser = async (payload: ILoginUserPayload) => {
    const { password } = payload
    const email = payload.email.trim().toLowerCase()

    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user) {
        throw new Error('User not found')
    }

    if (user.status === UserStatus.BLOCKED) {
        throw new Error('User is blocked')
    }

    if (user.password === null && user.googleid !== null) {
        throw new Error("user all ready register in google")
    }


    const isPasswordMatched = await bcrypt.compare(password, user.password as string)

    if (!isPasswordMatched) {
        throw new Error('Invalid credentials')
    }

    const jwtPayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.JWT_ACCESS_SECRET,
        config.JWT_EXPIRES_IN as SignOptions
    );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_refresh_secret,
        config.jwt_refresh_expires_in as SignOptions
    );

    return {
        accessToken,
        refreshToken
    }
}

const getMe = async (user: IRequestUser) => {
    const isUserExists = await prisma.user.findUnique({
        where: {
            id: user.userId,
        },
        omit: {
            password: true,
        },
    })

    if (!isUserExists) {
        throw new Error('User not found')
    }

    return isUserExists
}


const refreshToken = async (token: string) => {
    const verifiedRefreshToken = jwtUtils.verifyToken(token, config.jwt_refresh_secret)

    if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
        throw new Error(config.NODE_ENV === 'development' ? verifiedRefreshToken.error : 'Invalid refresh token')
    }

    const data = verifiedRefreshToken.data as JwtPayload

    const user = await prisma.user.findUnique({
        where: { id: data.userId },
    })

    if (!user || user.status !== UserStatus.ACTIVE) {
        throw new Error('User is inactive or not found')
    }

    const jwtPayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.JWT_ACCESS_SECRET,
        config.JWT_EXPIRES_IN as SignOptions
    );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_refresh_secret,
        config.jwt_refresh_expires_in as SignOptions
    );

    return {
        accessToken,
        refreshToken
    }
}


const googlelogin = async (payload: IGoogle) => {

    let googleidTokenPayload: TokenPayload | null | undefined = null;

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: payload.idTOken,
            audience: config.GOOGLE_CLIENT_ID
        })
        googleidTokenPayload = ticket.getPayload()


    } catch (error) {
        console.log("google id token verification error", error)
        throw new Error("invalid or expired google id token")
    }


    if (!googleidTokenPayload) {
        throw new Error("invalid or expired google id token")
    }

    if (!googleidTokenPayload.name) {
        throw new Error("email not found")
    }

    if (!googleidTokenPayload.email) {
        throw new Error("email not found")
    }

    
    const accountNumber = `ACC-${crypto.randomUUID()}`

    const ifUserExistWithGoogleAuth = await prisma.user.findUnique({
        where: {
            email: googleidTokenPayload.email,
            role: UserRole.CUSTOMER,
            googleid: googleidTokenPayload.sub
        }
    })

    let user = ifUserExistWithGoogleAuth


    if (!ifUserExistWithGoogleAuth) {


        const ifuserExistwithCredentia = await prisma.user.findUnique({
            where: {
                email: googleidTokenPayload.email,
                role: UserRole.CUSTOMER,
                provider: authProvider.CREDENTIAL
            }
        })

        if (ifuserExistwithCredentia) {


            if (ifuserExistwithCredentia.emailVerified === false) {
                throw new Error("email not verified")
            }

            if (ifuserExistwithCredentia.status === UserStatus.BLOCKED) {
                throw new Error("user block")
            }

            if (ifuserExistwithCredentia.status === UserStatus.DELETED) {
                throw new Error("user is deleted")
            }


            user = await prisma.user.update({
                where: {
                    id: ifuserExistwithCredentia.id
                },
                data: {
                    googleid: googleidTokenPayload.sub
                }
            })
        } else {
            user = await prisma.user.create({
                data: {
                    name: googleidTokenPayload.name,
                    email: googleidTokenPayload.email,
                    role: UserRole.CUSTOMER,
                    googleid: googleidTokenPayload.sub,
                    provider: authProvider.GOOGLE,
                    accountNumber,
                    emailVerified: true
                }
            })
        }


    }


    if (!user) {
        throw new Error("user not fount")
    }


    if (user.status === UserStatus.BLOCKED) {
        throw new Error("user block")
    }

    if (user.status === UserStatus.DELETED) {
        throw new Error("user is deleted")
    }


    const jwtPayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.JWT_ACCESS_SECRET,
        config.JWT_EXPIRES_IN as SignOptions
    );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_refresh_secret,
        config.jwt_refresh_expires_in as SignOptions
    );

    return {
        accessToken,
        refreshToken
    }


}


const forgotPassword = async (payload: IForgotpassword) => {
    const { email } = payload;

    const isUserExit = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (!isUserExit) {
        throw new Error("User does not exist");
    }

    if (isUserExit.status === UserStatus.BLOCKED) {
        throw new Error("User blocked");
    }

    if (isUserExit.status === UserStatus.DELETED) {
        throw new Error("User deleted");
    }

    // Email verification check
    if (!isUserExit.emailVerified) {
        throw new Error("Verify your email first");
    }

    // Google account check
    if (
        isUserExit.googleid ||
        isUserExit.provider === authProvider.GOOGLE
    ) {
        throw new Error("User has account with Google");
    }

    // Generate 6 digit OTP
    const otp = crypto.randomInt(100000, 1000000);

    // Redis key
    const key = `forgot-password-otp:${isUserExit.email}`;

    // Save OTP for 5 minutes
    await Redisclient.set(key, otp, {
        expiration: {
            type: "EX",
            value: 5 * 60,
        },
    });

    // Email template path
    const templatePath = path.join(
        process.cwd(),
        "src",
        "templates",
        "emails",
        "forgot-password.html"
    );

    // Read HTML template
    let html = fs.readFileSync(templatePath, "utf-8");

    // Replace template variables
    html = html.replace(
        "{{name}}",
        isUserExit.name || "User"
    );

    html = html.replace(
        "{{otp}}",
        String(otp)
    );

    // Send email
    await transporter.sendMail({
        from: config.SMTP_USER,
        to: isUserExit.email,
        subject: "Forgot Password OTP",
        html,
    });

    return {
        message: "OTP sent successfully",
    };
};

const resetPassword = async (payload: IResetpassword) => {
    const { email, newPassword, otp } = payload

    const isUserExit = await prisma.user.findUnique({
        where: {
            email
        }
    })

    if (!isUserExit) {
        throw new Error("User does not exist")
    }

    if (isUserExit.status === UserStatus.BLOCKED) {
        throw new Error("User blocked")
    }

    if (isUserExit.status === UserStatus.DELETED) {
        throw new Error("usser deleted")

    }

    if (!isUserExit.emailVerified === true) {
        throw new Error("verify your email first")
    }

    if (isUserExit.googleid || isUserExit.provider === authProvider.GOOGLE) {
        throw new Error("user has account with google")
    }

    const key = `forgot-password-otp:${isUserExit.email}`;
    const redisOTP = await Redisclient.get(key)

    if (!redisOTP) {
        throw new Error("OPT not found")
    }

    if (redisOTP !== otp) {
        throw new Error("OTP not match")
    }

    const hashedPassword = await bcrypt.hash(newPassword, Number(config.BCRYPT_SALT_ROUNDS));

    await prisma.user.update({
        where: {
            email: email
        },
        data: {
            password: hashedPassword
        }
    })

    await Redisclient.del([key])

    const templatePath = path.join(
        process.cwd(),
        "src",
        "templates",
        "emails",
        "password-changed.html"
    );

    let html = fs.readFileSync(templatePath, "utf-8");

    // Replace template variables
    html = html.replace(
        "{{name}}",
        isUserExit.name || "User"
    );



    await transporter.sendMail({
        from: config.SMTP_USER,
        to: isUserExit.email,
        subject: "Your Password Has Been Changed",
        html,
    });
}


export const AuthService = {
    registerUser,
    loginUser,
    getMe,
    refreshToken,
    googlelogin,
    forgotPassword,
    resetPassword,
    verifyuseraccout
}