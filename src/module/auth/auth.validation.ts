import z from "zod";

 const userRegistrationZodSchema = z.object({
    name: z.string("Not A String!!!!!").min(3, "Name must atleast 3 characters long!!!").max(10),
    email: z.email("Not email!!"),
    password: z.string()
})

const LoginZodSchema = z.object({
    email : z.email(),
    password: z.string()
})

export const UserValidation = {
   userRegistrationZodSchema,
    LoginZodSchema
}