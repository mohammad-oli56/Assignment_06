import path from "node:path";
import dotenv from "dotenv";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

export default {
  PORT: process.env.PORT,
    APP_URL : process.env.APP_URL,
    BCRYPT_SALT_ROUNDS : process.env.BCRYPT_SALT_ROUNDS,
    JWT_ACCESS_SECRET : process.env.JWT_ACCESS_SECRET!,
    JWT_EXPIRES_IN:process.env.JWT_EXPIRES_IN!,
    jwt_refresh_secret:process.env.jwt_refresh_secret!,
    jwt_refresh_expires_in:process.env.jwt_refresh_expires_in!,
    NODE_ENV:process.env.NODE_ENV,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
    ADMIN_EMAIL:process.env.ADMIN_EMAIL,
     ADMIN_PASS:process.env.ADMIN_PASS,
};