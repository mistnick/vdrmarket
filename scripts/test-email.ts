// Test script to send invitation email via Resend
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "DataRoom <onboarding@resend.dev>";

async function testSendEmail() {
    if (!RESEND_API_KEY) {
        console.error("RESEND_API_KEY not configured");
        process.exit(1);
    }

    console.log("RESEND_API_KEY:", RESEND_API_KEY.substring(0, 10) + "...");
    console.log("EMAIL_FROM:", EMAIL_FROM);

    const resend = new Resend(RESEND_API_KEY);

    const activationUrl = "http://localhost:3000/auth/activate?token=test123";

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        a { color: #1e40af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">SimpleVDR</h1>
        </div>
        <div class="content">
          <h2>Admin DataRoom</h2>
          <p>Admin User invited you to the project</p>
          <br>
          <p>Dear User,</p>
          <br>
          <p>Admin User invited you to Admin DataRoom.</p>
          <p>To enter the project you'll need to create an account.</p>
          <br>
          <p>Open this link to confirm the activation and to access the environment:</p>
          <p><a href="${activationUrl}">${activationUrl}</a></p>
          <br>
          <p>Kind regards,<br>SimpleVDR Team</p>
          <br>
          <p style="color: #666; font-size: 12px;">This email was sent to f.gallo@outlook.com</p>
          <p style="color: #666; font-size: 12px;">© 2025 SimpleVDR. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    try {
        console.log("\nSending email to mistnick@gmail.com...");
        
        const { data, error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: "mistnick@gmail.com",
            subject: "You've been invited to join Admin DataRoom",
            html,
        });

        if (error) {
            console.error("❌ Error:", error);
            process.exit(1);
        }

        console.log("✅ Email sent successfully!");
        console.log("Message ID:", data?.id);
    } catch (err) {
        console.error("❌ Exception:", err);
        process.exit(1);
    }
}

testSendEmail();
