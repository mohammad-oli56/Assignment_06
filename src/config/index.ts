import path from "node:path";
import dotenv from "dotenv";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

export default {
  PORT: process.env.PORT,
      APP_URL : process.env.APP_URL,
};