import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: any[];
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private provider: "smtp" | "sendgrid" | "resend" | "mock" = "mock";

  constructor() {
    this.initProvider();
  }

  private initProvider() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      this.provider = "smtp";
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else if (process.env.SENDGRID_API_KEY) {
      this.provider = "sendgrid";
      // Initialize SendGrid transporter (using nodemailer-sendgrid or similar)
      // For now, fallback to mock if library not installed
    } else if (process.env.RESEND_API_KEY) {
      this.provider = "resend";
      // Initialize Resend
    } else {
      this.provider = "mock";
      console.log("📧 Email Service initialized in MOCK mode");
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, html, text, from, attachments } = options;
    const fromAddress = from || process.env.EMAIL_FROM || "noreply@dataroom.com";

    try {
      if (this.provider === "mock" || !this.transporter) {
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
      }

      await this.transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ""), // Simple strip tags
        attachments,
      });

      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
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

