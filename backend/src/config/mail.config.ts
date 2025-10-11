import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_SMTP_HOST || "smtp.mailtrap.io",
  port: process.env.MAIL_SMTP_PORT || 2525,
  auth: {
    user: process.env.MAIL_SMTP_USERNAME, // from SMTP settings
    pass: process.env.MAIL_SMTP_PASSWORD, // from SMTP settings
  },
});

export default transporter;

// async function sendTestEmail() {
//   await transporter.sendMail({
//     from: "test@sandbox.mailtrap.io",       // sender
//     to: "recipient@sandbox.mailtrap.io",    // recipient
//     subject: "Hello from Mailtrap SMTP!",
//     text: "This is a test email captured in the sandbox.",
//   });

//   console.log("Email sent successfully!");
// }

// sendTestEmail().catch(console.error);
