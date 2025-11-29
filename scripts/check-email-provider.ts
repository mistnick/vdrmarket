
import "dotenv/config";
import { emailService } from "../lib/email/service";

async function checkProvider() {
    const info = emailService.getProviderInfo();
    console.log("Current Email Provider Info:", JSON.stringify(info, null, 2));

    // Also print environment variable presence (safe)
    console.log("Environment Variables Check:");
    console.log("SMTP_HOST:", !!process.env.SMTP_HOST);
    console.log("RESEND_API_KEY:", !!process.env.RESEND_API_KEY);
    console.log("AWS_SES_ACCESS_KEY_ID:", !!process.env.AWS_SES_ACCESS_KEY_ID);
}

checkProvider();
