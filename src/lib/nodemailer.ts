import nodemailer from "nodemailer";
import config from "../config";



export const transporter = nodemailer.createTransport({
  service: "gmail", // Shortcut for Gmail's SMTP settings - see Well-Known Services
  auth: {
    user: config.SMTP_USER,
    pass:config.GMAIL_PASSWORD
  },
});