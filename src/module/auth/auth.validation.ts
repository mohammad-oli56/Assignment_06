import z from "zod";

 const userRegistrationZodSchema = z.object({
   name: z .string("Name must be a string") .min(3, "Name must be at least 3 characters long") .max(50, "Name cannot exceed 50 characters"),
   email: z.email("Please provide a valid email"),
  password: z .string() .min(6, "Password must be at least 6 characters long") .max(50, "Password cannot exceed 50 characters"),
})

const LoginZodSchema = z.object({
   email: z.email("Please provide a valid email"),
   password: z .string() .min(6, "Password must be at least 6 characters long") .max(50, "Password cannot exceed 50 characters"),
})

export const UserValidation = {
   userRegistrationZodSchema,
    LoginZodSchema
}