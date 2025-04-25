import nodemailer from "nodemailer";

export const mailTransporter1 = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true — для 465, false — для 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
// Looking to send emails in production? Check out our Email API/SMTP product!
export const mailTransporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "1ed89504292ccf",
    pass: "1df5a9fdcc7f34",
  },
});
