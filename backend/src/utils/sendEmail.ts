import transporter from "../config/mail.config.ts";
import { PASSWORD_RESET_REQUEST_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE } from "../templates/emailTemplate.ts";


export const sendEmailVerificationCode = async (recipientEmail: string, token: number) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.MAIL_SENDER_EMAIL || "multi.vendor@test.com",
            to: recipientEmail,
            subject: "Email Verification Code",
            html: VERIFICATION_EMAIL_TEMPLATE.replace('{verificationCode}', token.toString()),
        });
        console.log("Email sent: ", info.messageId);
    } catch (error) {
        console.error("Error sending email: ", error);
        throw new Error("Could not send email");
    }
};


export const sendPasswordResetToken = async (recipientEmail: string, token: number) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.MAIL_SENDER_EMAIL || "multi.vendor@test.com",
            to: recipientEmail,
            subject: "Password Reset Code",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace('{resetAuthorizationCode}', token.toString()),
        });
        console.log("Email sent: ", info.messageId);
    } catch (error) {
        console.error("Error sending email: ", error);
        throw new Error("Could not send email");
    }
}