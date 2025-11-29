import "dotenv/config";
import nodemailer from "nodemailer";

async function verifySmtp() {
    console.log("Starting SMTP Verification with provided credentials...");

    // Hardcoded test with user provided credentials
    const transporter = nodemailer.createTransport({
        host: "smtps.aruba.it",
        port: 465,
        secure: true,
        auth: {
            user: "admin@dataroom.com",
            pass: "Admin123!",
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    const testEmail = "admin@dataroom.com";
    console.log(`Sending test email to ${testEmail} using admin@dataroom.com...`);

    try {
        const info = await transporter.sendMail({
            from: "admin@dataroom.com",
            to: testEmail,
            subject: "SMTP Debug Test - Explicit Credentials",
            html: "<h1>SMTP Works!</h1><p>This is a test email using provided credentials.</p>",
        });
        console.log(`✅ Email sent successfully! MessageId: ${info.messageId}`);
    } catch (error) {
        console.error("❌ Failed to send email:", error);
    }
}

verifySmtp();
