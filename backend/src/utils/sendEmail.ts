import { format } from "date-fns";
import transporter from "../config/mail.config.js";
import { PASSWORD_RESET_REQUEST_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE } from "../templates/emailTemplate.js";


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


export const sendReportEmail = async (
    recipientEmail: string,
    buffer: any, // ✅ Changed from Buffer to any
    reportName: string,
    recordCount: number
) => {
    try {
        const filename = `${reportName.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

        const info = await transporter.sendMail({
            from: process.env.MAIL_SENDER_EMAIL || "multi.vendor@test.com",
            to: recipientEmail,
            subject: `${reportName} - Report Ready`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Your Report is Ready</h2>
                    <p>Hello,</p>
                    <p>Your <strong>${reportName}</strong> has been generated successfully.</p>
                    <p><strong>Total Records:</strong> ${recordCount}</p>
                    <p>Please find the report attached to this email.</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated email. Please do not reply.
                    </p>
                </div>
            `,
            attachments: [
                {
                    filename,
                    content: buffer,
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            ]
        });

        console.log("Report email sent: ", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending report email: ", error);
        throw new Error("Could not send report email");
    }
};