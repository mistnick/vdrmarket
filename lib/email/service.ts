import nodemailer from "nodemailer";
import { SESClient, SendEmailCommand, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { Resend } from "resend";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: any[];
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private sesClient: SESClient | null = null;
  private resendClient: Resend | null = null;
  private provider: "smtp" | "ses" | "sendgrid" | "resend" | "mock" = "mock";

  constructor() {
    this.initProvider();
  }

  private initProvider() {
    // Priority 1: SMTP (recommended for self-hosted)
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      this.provider = "smtp";
      const port = parseInt(process.env.SMTP_PORT || "465");
      const secure = process.env.SMTP_SECURE !== "false" && (process.env.SMTP_SECURE === "true" || port === 465);
      
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: secure, // true for 465 (SMTPS), false for 587 (STARTTLS)
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          // Do not fail on invalid certs (useful for self-signed)
          rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
        },
      });
      console.log(`📧 Email Service initialized with SMTP (${process.env.SMTP_HOST}:${port}, secure: ${secure})`);
    }
    // Priority 2: AWS SES
    else if (process.env.AWS_SES_ACCESS_KEY_ID && process.env.AWS_SES_SECRET_ACCESS_KEY) {
      this.provider = "ses";
      this.sesClient = new SESClient({
        region: process.env.AWS_SES_REGION || "eu-west-1",
        credentials: {
          accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
        },
      });
      console.log(`📧 Email Service initialized with AWS SES (region: ${process.env.AWS_SES_REGION || "eu-west-1"})`);
    }
    // Priority 3: Resend
    else if (process.env.RESEND_API_KEY) {
      this.provider = "resend";
      this.resendClient = new Resend(process.env.RESEND_API_KEY);
      console.log("📧 Email Service initialized with Resend");
    }
    // Priority 4: SendGrid
    else if (process.env.SENDGRID_API_KEY) {
      this.provider = "sendgrid";
      console.log("📧 Email Service initialized with SendGrid (not fully implemented)");
    }
    // Fallback: Mock
    else {
      this.provider = "mock";
      console.log("📧 Email Service initialized in MOCK mode - configure SMTP_HOST or other providers for production");
    }
  }

  /**
   * Send email via Resend
   */
  private async sendViaResend(options: SendEmailOptions): Promise<EmailResult> {
    if (!this.resendClient) {
      return { success: false, error: "Resend client not initialized" };
    }

    const { to, subject, html, text, from, attachments } = options;
    const fromAddress = from || process.env.EMAIL_FROM || "onboarding@resend.dev";
    const toAddresses = Array.isArray(to) ? to : [to];

    try {
      // Convert attachments to Resend format if present
      const resendAttachments = attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
      }));

      const { data, error } = await this.resendClient.emails.send({
        from: fromAddress,
        to: toAddresses,
        subject,
        html,
        text: text || this.stripHtml(html),
        attachments: resendAttachments,
      });

      if (error) {
        console.error(`❌ Failed to send email via Resend: ${error.message}`);
        return { success: false, error: error.message };
      }

      console.log(`✅ Email sent via Resend to ${toAddresses.join(", ")} (MessageId: ${data?.id})`);
      return { success: true, messageId: data?.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to send email via Resend: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send email via AWS SES
   */
  private async sendViaSES(options: SendEmailOptions): Promise<EmailResult> {
    if (!this.sesClient) {
      return { success: false, error: "SES client not initialized" };
    }

    const { to, subject, html, text, from, attachments } = options;
    const fromAddress = from || process.env.EMAIL_FROM || "noreply@dataroom.com";
    const toAddresses = Array.isArray(to) ? to : [to];

    try {
      // If we have attachments, use SendRawEmailCommand with nodemailer to build MIME
      if (attachments && attachments.length > 0) {
        return this.sendRawEmailViaSES(options);
      }

      const command = new SendEmailCommand({
        Source: fromAddress,
        Destination: {
          ToAddresses: toAddresses,
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: html,
              Charset: "UTF-8",
            },
            Text: {
              Data: text || this.stripHtml(html),
              Charset: "UTF-8",
            },
          },
        },
        ConfigurationSetName: process.env.AWS_SES_CONFIGURATION_SET || undefined,
      });

      const response = await this.sesClient.send(command);
      console.log(`✅ Email sent via AWS SES to ${toAddresses.join(", ")} (MessageId: ${response.MessageId})`);
      return { success: true, messageId: response.MessageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to send email via AWS SES: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send raw email via AWS SES (supports attachments)
   */
  private async sendRawEmailViaSES(options: SendEmailOptions): Promise<EmailResult> {
    if (!this.sesClient) {
      return { success: false, error: "SES client not initialized" };
    }

    const { to, subject, html, text, from, attachments } = options;
    const fromAddress = from || process.env.EMAIL_FROM || "noreply@dataroom.com";
    const toAddresses = Array.isArray(to) ? to : [to];

    try {
      // Use nodemailer to build MIME message
      const transporter = nodemailer.createTransport({ streamTransport: true });
      const mailOptions = {
        from: fromAddress,
        to: toAddresses.join(", "),
        subject,
        html,
        text: text || this.stripHtml(html),
        attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      const rawMessage = await this.streamToBuffer(info.message);

      const command = new SendRawEmailCommand({
        RawMessage: { Data: rawMessage },
        ConfigurationSetName: process.env.AWS_SES_CONFIGURATION_SET || undefined,
      });

      const response = await this.sesClient.send(command);
      console.log(`✅ Raw email sent via AWS SES to ${toAddresses.join(", ")} (MessageId: ${response.MessageId})`);
      return { success: true, messageId: response.MessageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to send raw email via AWS SES: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Convert stream or buffer to Uint8Array for raw email
   */
  private async streamToBuffer(input: NodeJS.ReadableStream | Buffer): Promise<Uint8Array> {
    // If it's already a Buffer, convert directly
    if (Buffer.isBuffer(input)) {
      return new Uint8Array(input);
    }

    // Otherwise treat as stream
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      input.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      input.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
      input.on("error", reject);
    });
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, html, text, from, attachments } = options;
    const fromAddress = from || process.env.EMAIL_FROM || "noreply@dataroom.com";

    try {
      // AWS SES
      if (this.provider === "ses" && this.sesClient) {
        const result = await this.sendViaSES(options);
        return result.success;
      }

      // Resend
      if (this.provider === "resend" && this.resendClient) {
        const result = await this.sendViaResend(options);
        return result.success;
      }

      // SMTP via nodemailer
      if (this.provider === "smtp" && this.transporter) {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          html,
          text: text || this.stripHtml(html),
          attachments,
        });
        console.log(`✅ Email sent via SMTP to ${Array.isArray(to) ? to.join(", ") : to} (MessageId: ${info.messageId})`);
        return true;
      }

      // Mock mode
      console.log(`
📧 [MOCK EMAIL]
To: ${Array.isArray(to) ? to.join(", ") : to}
From: ${fromAddress}
Subject: ${subject}
---
${text || "(HTML Content)"}
---
      `);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  /**
   * Get current provider info
   */
  getProviderInfo(): { provider: string; configured: boolean } {
    return {
      provider: this.provider,
      configured: this.provider !== "mock",
    };
  }
}

export const emailService = new EmailService();

import { EmailTemplates } from "./templates";

export async function sendTeamInvitationEmail({
  to,
  inviterName,
  teamName,
  link,
}: {
  to: string;
  inviterName: string;
  teamName: string;
  link: string;
}) {
  return emailService.sendEmail({
    to,
    subject: `Invitation to join ${teamName} on SimpleVDR`,
    html: EmailTemplates.invitation(inviterName, teamName, link),
  });
}

export async function sendWelcomeEmail({
  to,
  name,
  link,
}: {
  to: string;
  name: string;
  link: string;
}) {
  return emailService.sendEmail({
    to,
    subject: "Welcome to SimpleVDR",
    html: EmailTemplates.welcome(name, link),
  });
}

export async function sendDocumentSharedEmail({
  to,
  sharerName,
  documentName,
  link,
  senderName, // Handle alias if passed
  expiresAt,
}: {
  to: string;
  sharerName?: string;
  senderName?: string;
  documentName: string;
  link: string;
  recipientName?: string; // Ignore extra params
  expiresAt?: Date;
}) {
  return emailService.sendEmail({
    to,
    subject: "Document Shared with You",
    html: EmailTemplates.documentShared(sharerName || senderName || "Someone", documentName, link, expiresAt),
  });
}

export async function sendPasswordResetEmail({
  to,
  userName,
  resetLink,
}: {
  to: string;
  userName: string;
  resetLink: string;
}) {
  return emailService.sendEmail({
    to,
    subject: "Reset your SimpleVDR password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Password</h2>
        <p>Hello ${userName},</p>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendVerificationEmail({
  to,
  name,
  link,
}: {
  to: string;
  name: string;
  link: string;
}) {
  return sendWelcomeEmail({ to, name, link });
}

export async function sendCommentMentionEmail({
  to,
  mentionerName,
  documentName,
  commentPreview,
  link,
}: {
  to: string;
  mentionerName: string;
  documentName: string;
  commentPreview: string;
  link: string;
}) {
  return emailService.sendEmail({
    to,
    subject: `${mentionerName} mentioned you in a comment`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You were mentioned in a comment</h2>
        <p><strong>${mentionerName}</strong> mentioned you in a comment on <strong>${documentName}</strong>:</p>
        <div style="background: #f5f5f5; padding: 15px; border-left: 3px solid #20AF79; margin: 20px 0;">
          <p style="margin: 0; color: #666;">${commentPreview}</p>
        </div>
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #20AF79; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Comment</a>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">You received this because you were mentioned in a comment.</p>
      </div>
    `,
  });
}

export async function sendQAActivityEmail({
  to,
  actorName,
  actionType,
  questionTitle,
  answerPreview,
  link,
}: {
  to: string;
  actorName: string;
  actionType: "question" | "answer";
  questionTitle: string;
  answerPreview?: string | null;
  link: string;
}) {
  const subject = actionType === "question"
    ? `New question: ${questionTitle}`
    : `New answer to: ${questionTitle}`;

  const content = actionType === "question"
    ? `<p><strong>${actorName}</strong> posted a new question:</p>
       <div style="background: #f5f5f5; padding: 15px; border-left: 3px solid #20AF79; margin: 20px 0;">
         <p style="margin: 0; font-weight: 600;">${questionTitle}</p>
       </div>`
    : `<p><strong>${actorName}</strong> answered:</p>
       <div style="background: #f5f5f5; padding: 15px; border-left: 3px solid #20AF79; margin: 20px 0;">
         <p style="margin: 0; font-weight: 600;">${questionTitle}</p>
         <p style="margin: 10px 0 0 0; color: #666;">${answerPreview}</p>
       </div>`;

  return emailService.sendEmail({
    to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Q&A Activity</h2>
        ${content}
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #20AF79; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 10px;">View ${actionType === "question" ? "Question" : "Answer"}</a>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">You received this because of your role in the data room.</p>
      </div>
    `,
  });
}

