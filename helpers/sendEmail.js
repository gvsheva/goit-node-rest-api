import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT = 465,
  SMTP_SECURE = "true",
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_SECURE === "true",
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

const sendEmail = async (data) => {
  const email = { from: SMTP_FROM || SMTP_USER, ...data };
  await transporter.sendMail(email);
};

export default sendEmail;
