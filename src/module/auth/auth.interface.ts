import { UserRole } from "../../../generated/prisma/enums"

export interface IRegisterUserPayload {
  name: string
  email: string
  password: string
  phone: string
}


export interface ILoginUserPayload {
     email: string
  password: string
}

export interface IRequestUser {
    userId: string
    email: string
    name: string
    role: UserRole
}


export interface IGoogle {
  idTOken : string
}


export interface IForgotpassword{
  email:string
}

export interface IResetpassword{
  email:string
  newPassword : string
  otp: string
}