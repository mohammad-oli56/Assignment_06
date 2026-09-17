import bcrypt from "bcryptjs"
import { JwtPayload, SignOptions } from 'jsonwebtoken'
import { jwtUtils } from "../../utils/jwt"
import { prisma } from "../../lib/prisma"
import { IGoogle, ILoginUserPayload, IRegisterUserPayload, IRequestUser } from "./auth.interface"
import config from "../../config"
import { authProvider, UserRole, UserStatus } from "../../../generated/prisma/enums"
import { OAuth2Client, TokenPayload } from "google-auth-library"
import { googleClient } from "../../lib/googleauth"
import { error } from "node:console"


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

    // Create user
    const createdUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            phone,
            role: "CUSTOMER",
        },
         omit: { password: true },
    })

    // Create JWT payload
    const JwtPayload = {
        userId: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
    }

    // Create access token
    const accessToken = jwtUtils.createToken(
        JwtPayload,
         config.JWT_ACCESS_SECRET,
        config.JWT_EXPIRES_IN as SignOptions
    )

      const refreshToken = jwtUtils.createToken(
        JwtPayload,
        config.jwt_refresh_secret,
        config.jwt_refresh_expires_in as SignOptions
    );

  

    return {
        createdUser,
        accessToken,
        refreshToken
    }
}

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

    if(user.password === null && user.googleid !== null){
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

    if (!user  || user.status !== UserStatus.ACTIVE) {
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


const googlelogin = async(payload:IGoogle)=>{

    let googleidTokenPayload:TokenPayload| null|undefined =  null;

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken:payload.idTOken,
            audience:config.GOOGLE_CLIENT_ID
        })
        googleidTokenPayload = ticket.getPayload()


    } catch (error) {
        console.log("google id token verification error",error)
        throw new Error("invalid or expired google id token")
    }


    if(!googleidTokenPayload){
      throw new Error("invalid or expired google id token")  
    }

      if(!googleidTokenPayload.name){
        throw new Error("email not found")
    }

    if(!googleidTokenPayload.email){
        throw new Error("email not found")
    }


    const ifUserExistWithGoogleAuth =  await prisma.user.findUnique({
        where:{
            email:googleidTokenPayload.email,
            role : UserRole.CUSTOMER,
            googleid : googleidTokenPayload.sub
        }
    })

    let user = ifUserExistWithGoogleAuth


    if(!ifUserExistWithGoogleAuth){


        const ifuserExistwithCredentia =await prisma.user.findUnique({
            where : {
                email : googleidTokenPayload.email,
                role: UserRole.CUSTOMER,
                provider : authProvider.CREDENTIAL
            }
        })

        if(ifuserExistwithCredentia){


            if(ifuserExistwithCredentia.emailVerified===false){
                throw new Error("email not verified")
            }

            if(ifuserExistwithCredentia.status === UserStatus.BLOCKED){
                throw new Error("user block")
            }

             if(ifuserExistwithCredentia.status === UserStatus.DELETED){
                throw new Error("user is deleted")
            }


            user = await prisma.user.update({
                where:{
                    id:ifuserExistwithCredentia.id
                },
                data:{
                    googleid:googleidTokenPayload.sub
                }
            })
        }else{
             user = await prisma.user.create({
            data:{
                name:googleidTokenPayload.name,
                email:googleidTokenPayload.email,
                role:UserRole.CUSTOMER,
                googleid:googleidTokenPayload.sub,
                provider:authProvider.GOOGLE,
                emailVerified:true
            }
        })
        }

       
    }

    
    if(!user){
        throw new Error("user not fount")
    }


    if(user.status === UserStatus.BLOCKED){
        throw new Error("user block")
    }

    if(user.status === UserStatus.DELETED){
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



export const AuthService = {
    registerUser,
    loginUser,
    getMe,
    refreshToken,
    googlelogin
}