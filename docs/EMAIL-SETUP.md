# Email Service Setup Guide

## 🚀 Quick Start

### 1. Get Resend API Key

1. Go to https://resend.com
2. Sign up for free account (100 emails/day free tier)
3. Verify your email
4. Go to "API Keys" section
5. Create new API key
6. Copy the key (starts with `re_...`)

### 2. Configure Environment

Add to your `.env` file:

```env
# Email Service (Resend)
RESEND_API_KEY=re_your_actual_api_key_here
EMAIL_FROM=DataRoom <noreply@yourdomain.com>
```

**Important**: 
- For production, verify your domain in Resend dashboard
- For development, use verified email address

### 3. Test Email Service

#### Option A: Via API (cURL)

```bash
# 1. Create a share link with email whitelist
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -H "Cookie: dataroom-session=your_session_cookie" \
  -d '{
    "documentId": "your_document_id",
    "name": "Test Document Share",
    "allowedEmails": ["your-email@example.com"],
    "expiresAt": "2025-12-31T23:59:59Z"
  }'

# 2. Check your email inbox
```

#### Option B: Via UI

1. Login to http://localhost:3000/auth/login
2. Upload a document
3. Click "Share" or "Create Link"
4. Add email address in "Allowed Emails"
5. Submit form
6. Check email inbox

### 4. Verify Logs

Check console output for email status:

```bash
# If successful
✅ Document share email sent to user@example.com

# If API key not configured
⚠️ RESEND_API_KEY not configured. Email not sent

# If error occurred
❌ Failed to send email to user@example.com: [error details]
```

---

## 📧 Email Templates

### 1. Document Shared Email

**Trigger**: Creating share link with email whitelist

**Includes**:
- Sender name and email
- Document name
- View document CTA button
- Expiration date (if set)
- Direct link fallback

**Template**: `lib/email/templates.ts` → `documentSharedEmailHTML/Text`

### 2. Team Invitation Email

**Trigger**: Inviting user to team (to be implemented)

**Includes**:
- Inviter name and email
- Team name
- Role assignment
- Accept invitation CTA button
- Invitation link

**Template**: `lib/email/templates.ts` → `teamInvitationEmailHTML/Text`

### 3. Password Reset Email

**Trigger**: Password reset request (to be implemented)

**Includes**:
- User name
- Reset password CTA button
- Expiration warning (1 hour)
- Security notice

**Function**: `lib/email/service.ts` → `sendPasswordResetEmail()`

### 4. Email Verification

**Trigger**: User signup (to be implemented)

**Includes**:
- Welcome message
- Verify email CTA button
- Direct verification link

**Function**: `lib/email/service.ts` → `sendEmailVerificationEmail()`

---

## 🔧 Advanced Configuration

### Custom Email Domain

1. Add domain to Resend dashboard
2. Add DNS records (SPF, DKIM, DMARC)
3. Verify domain
4. Update `.env`:
   ```env
   EMAIL_FROM=DataRoom <no-reply@yourdomain.com>
   ```

### Email Queue (Optional - Future Enhancement)

For high-volume email sending:

```bash
npm install bullmq ioredis
```

Create `/lib/email/queue.ts`:

```typescript
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { sendEmail } from './service';

const connection = new Redis(process.env.REDIS_URL!);

export const emailQueue = new Queue('emails', { connection });

// Worker
new Worker(
  'emails',
  async (job) => {
    await sendEmail(job.data);
  },
  { connection }
);

// Usage
await emailQueue.add('send-email', {
  to: 'user@example.com',
  subject: 'Test',
  html: '<p>Test</p>',
  text: 'Test',
});
```

### Rate Limiting

Add to `middleware.ts`:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 emails per minute
});

// In API route
const { success } = await ratelimit.limit(userId);
if (!success) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  );
}
```

---

## 🧪 Testing

### Unit Tests

```bash
npm test -- lib/email/service.test.ts
```

Example test:

```typescript
// __tests__/lib/email/service.test.ts
import { sendEmail } from '@/lib/email/service';

describe('Email Service', () => {
  it('should return error if API key not configured', async () => {
    delete process.env.RESEND_API_KEY;
    
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      text: 'Test',
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Email service not configured');
  });
});
```

### Integration Tests

```bash
npm test -- __tests__/api/links.integration.test.ts
```

Test email sending in link creation:

```typescript
it('should send email when creating link with whitelist', async () => {
  const emailSpy = jest.spyOn(emailService, 'sendDocumentSharedEmail');
  
  await request(app)
    .post('/api/links')
    .send({
      documentId: 'doc123',
      allowedEmails: ['test@example.com'],
    });
  
  expect(emailSpy).toHaveBeenCalledWith({
    to: 'test@example.com',
    // ... other params
  });
});
```

---

## 📊 Monitoring

### Email Logs

Check Resend dashboard for:
- Delivery status
- Bounce rates
- Open rates (if tracking enabled)
- Click rates

### Application Logs

```bash
# Docker logs
docker-compose logs app | grep -i "email"

# Local development
npm run dev
# Watch console for email messages
```

### Error Tracking

Add to Sentry or similar:

```typescript
try {
  await sendEmail({ ... });
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'email' },
    extra: { recipient: to, subject },
  });
}
```

---

## 🚨 Troubleshooting

### Email Not Sending

**Check 1**: API Key configured
```bash
echo $RESEND_API_KEY
# Should output: re_xxxxx
```

**Check 2**: Email FROM address verified
- In Resend dashboard, check "Domains" or "Email Addresses"
- Verify DNS records if using custom domain

**Check 3**: Console logs
```bash
docker-compose logs app --tail=50 | grep -i "email"
```

### Email Ending in Spam

**Solutions**:
1. Verify domain with SPF/DKIM/DMARC
2. Warm up sending domain (gradual volume increase)
3. Add unsubscribe link in templates
4. Monitor bounce/complaint rates

### Rate Limit Exceeded

**Resend Free Tier**: 100 emails/day

**Solutions**:
1. Upgrade Resend plan
2. Implement email queue with batching
3. Add rate limiting per user
4. Cache notifications (daily digest)

### Template Rendering Issues

**Debug**:
1. Test HTML in browser
2. Use email testing service (Litmus, Email on Acid)
3. Check console for template errors

---

## 📚 Resources

- **Resend Docs**: https://resend.com/docs
- **Email Templates**: https://github.com/resend/react-email
- **Best Practices**: https://sendgrid.com/blog/email-best-practices/
- **Deliverability**: https://www.mailgun.com/blog/email-deliverability-101/

---

## 🎯 Next Steps

1. ✅ Email service implemented
2. ⏳ Test with real Resend API key
3. ⏳ Implement team invitation flow
4. ⏳ Add password reset flow
5. ⏳ Add email verification
6. ⏳ Implement email queue (high volume)
7. ⏳ Add analytics/tracking

---

**Last Updated**: 21 November 2025  
**Status**: ✅ Ready for Testing
