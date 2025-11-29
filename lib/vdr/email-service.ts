import { prisma } from "@/lib/db/prisma";
import { emailService } from "@/lib/email/service";

interface InvitationEmailData {
    to: string;
    userName?: string;
    inviterName: string;
    dataRoomName: string;
    token: string;
    expiresAt: Date;
}

const DEFAULT_INVITATION_TEMPLATE = `<VDR_name>
<Sender_user> invited you to the project
 

Dear <Name,Surname>,
 

<Sender_Name Sender_Surname> invited you to <VDR_name>.

To enter the project you'll need to create an account. The creation may require 2-step verification, depending on <VDR_name>'s settings.

Open this link to confirm the activation and to access the environment:
<Confirmation_url>
If it doesn't work, copy and paste this link into your browser. 

Kind regards,
SimpleVDR Team

This email was sent to <recipient_addr>

<Unsubscribe>

<Privacy_policy>	<Terms_of_use>	<Help_center>	<Contact_support>
 
© 2025 SimpleVDR. All rights reserved.`;

/**
 * Replace placeholders in template with actual values
 */
function replacePlaceholders(
    template: string,
    data: {
        vdrName: string;
        senderEmail: string;
        senderName: string;
        recipientName: string;
        confirmationUrl: string;
        recipientEmail: string;
    }
): string {
    const baseUrl = process.env.NEXTAUTH_URL || "https://app.simplevdr.com";
    
    return template
        .replace(/<VDR_name>/g, data.vdrName)
        .replace(/<Sender_user>/g, data.senderEmail)
        .replace(/<Sender_Name Sender_Surname>/g, data.senderName)
        .replace(/<Name,Surname>/g, data.recipientName || "User")
        .replace(/<Confirmation_url>/g, data.confirmationUrl)
        .replace(/<recipient_addr>/g, data.recipientEmail)
        .replace(/<Unsubscribe>/g, `<a href="${baseUrl}/unsubscribe">Unsubscribe</a>`)
        .replace(/<Privacy_policy>/g, `<a href="${baseUrl}/privacy">Privacy Policy</a>`)
        .replace(/<Terms_of_use>/g, `<a href="${baseUrl}/terms">Terms of Use</a>`)
        .replace(/<Help_center>/g, `<a href="${baseUrl}/help">Help Center</a>`)
        .replace(/<Contact_support>/g, `<a href="${baseUrl}/support">Contact Support</a>`);
}

/**
 * Generate invitation email content without sending (for preview)
 */
export async function generateInvitationEmailContent(data: InvitationEmailData): Promise<string> {
    const { to, userName, inviterName, dataRoomName, token } = data;

    const activationUrl = `${process.env.NEXTAUTH_URL}/auth/activate?token=${token}`;

    // Try to get custom template from database
    let templateContent = DEFAULT_INVITATION_TEMPLATE;
    
    try {
        const customTemplate = await prisma.emailTemplate.findUnique({
            where: { name: "group_invitation" },
        });
        
        if (customTemplate) {
            templateContent = customTemplate.htmlContent;
        }
    } catch (error) {
        console.warn("Could not fetch custom email template, using default:", error);
    }

    // Replace placeholders
    const emailContent = replacePlaceholders(templateContent, {
        vdrName: dataRoomName,
        senderEmail: inviterName.includes("@") ? inviterName : `${inviterName}@simplevdr.com`,
        senderName: inviterName,
        recipientName: userName || "",
        confirmationUrl: activationUrl,
        recipientEmail: to,
    });

    return emailContent;
}

/**
 * Send user invitation email (Group Invitation)
 */
export async function sendInvitationEmail(data: InvitationEmailData): Promise<void> {
    const { to, userName, inviterName, dataRoomName, token } = data;

    const activationUrl = `${process.env.NEXTAUTH_URL}/auth/activate?token=${token}`;

    // Try to get custom template from database
    let templateContent = DEFAULT_INVITATION_TEMPLATE;
    let subject = "You've been invited to join a Virtual Data Room";
    
    try {
        const customTemplate = await prisma.emailTemplate.findUnique({
            where: { name: "group_invitation" },
        });
        
        if (customTemplate) {
            templateContent = customTemplate.htmlContent;
            subject = customTemplate.subject;
        }
    } catch (error) {
        console.warn("Could not fetch custom email template, using default:", error);
    }

    // Replace placeholders
    const emailContent = replacePlaceholders(templateContent, {
        vdrName: dataRoomName,
        senderEmail: inviterName.includes("@") ? inviterName : `${inviterName}@simplevdr.com`,
        senderName: inviterName,
        recipientName: userName || "",
        confirmationUrl: activationUrl,
        recipientEmail: to,
    });

    // Wrap in HTML template for proper email rendering
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; white-space: pre-wrap; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding: 20px; }
        a { color: #1e40af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">SimpleVDR</h1>
        </div>
        <div class="content">
          ${emailContent.replace(/\n/g, "<br>")}
        </div>
      </div>
    </body>
    </html>
  `;

    // Use centralized email service
    const success = await emailService.sendEmail({
        to,
        subject,
        html,
        text: emailContent,
    });

    if (!success) {
        console.error(`[EMAIL] Failed to send invitation to ${to}`);
        throw new Error("Failed to send invitation email");
    }

    console.log(`[EMAIL] Invitation sent to ${to}`);
}

/**
 * Send password reset email for VDR users
 */
export async function sendPasswordResetEmail(
    to: string,
    userName: string,
    resetToken: string
): Promise<void> {
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .button { 
          display: inline-block; 
          background: #1e40af; 
          color: white; 
          padding: 12px 30px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          
          <p>You requested to reset your password for your SimpleVDR account.</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          
          <p>This link will expire in 1 hour.</p>
          
          <p>If you did not request a password reset, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    // Use centralized email service
    const success = await emailService.sendEmail({
        to,
        subject: "Password Reset Request",
        html,
    });

    if (!success) {
        console.error(`[EMAIL] Failed to send password reset to ${to}`);
        throw new Error("Failed to send password reset email");
    }

    console.log(`[EMAIL] Password reset sent to ${to}`);
}
