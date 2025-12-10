const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmailService = async ({ to, subject, html, attachments }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"EventX" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      html,
      attachments, // ⭐ QUAN TRỌNG
    });

    return { success: true };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error };
  }
};

module.exports = sendEmailService;
