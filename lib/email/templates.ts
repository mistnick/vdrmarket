export const EmailTemplates = {
  welcome: (name: string, link: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to SimpleVDR</h2>
      <p>Hello ${name},</p>
      <p>Welcome to your secure virtual data room platform. We're excited to have you on board.</p>
      <p>Please verify your email address to get started:</p>
      <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">Verify Email</a>
      <p>If you didn't create an account, you can ignore this email.</p>
    </div>
  `,

  invitation: (inviterName: string, teamName: string, link: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You've been invited!</h2>
      <p>Hello,</p>
      <p><strong>${inviterName}</strong> has invited you to join the team <strong>${teamName}</strong> on SimpleVDR.</p>
      <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">Accept Invitation</a>
    </div>
  `,

  documentShared: (sharerName: string, documentName: string, link: string, expiresAt?: Date) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Document Shared</h2>
      <p>Hello,</p>
      <p><strong>${sharerName}</strong> has shared a document with you: <strong>${documentName}</strong>.</p>
      ${expiresAt ? `<p>This link expires on: <strong>${expiresAt.toLocaleDateString()}</strong></p>` : ''}
      <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">View Document</a>
    </div>
  `,

  notificationDigest: (count: number, link: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You have unread notifications</h2>
      <p>Hello,</p>
      <p>You have <strong>${count}</strong> unread notifications in SimpleVDR.</p>
      <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">View Notifications</a>
    </div>
  `,
};
