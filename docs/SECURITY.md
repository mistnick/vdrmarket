# DataRoom - Security Documentation

**Last Updated**: November 27, 2025  
**Security Level**: Enterprise-Grade

This document provides a comprehensive overview of all security measures implemented in the DataRoom Virtual Data Room (VDR) application.

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Link Sharing Security](#link-sharing-security)
3. [File Upload & Storage Security](#file-upload--storage-security)
4. [Data Protection](#data-protection)
5. [Access Control & Permissions](#access-control--permissions)
6. [Audit & Monitoring](#audit--monitoring)
7. [Infrastructure Security](#infrastructure-security)
8. [Security Best Practices](#security-best-practices)

---

## Authentication & Authorization

### User Authentication

#### Password Security
- **Hashing**: bcrypt with salt (work factor: 10 rounds)
- **Minimum Requirements**: Enforced strong password policy
- **Storage**: Never stored in plaintext

#### Session Management
- **Provider**: NextAuth.js v5 (Auth.js)
- **Session Tokens**: Cryptographically secure, HTTP-only cookies
- **Expiration**: Configurable session timeout
- **Refresh**: Automatic token refresh on activity

#### Two-Factor Authentication (2FA)
- **Status**: Prepared (schema ready)
- **Storage**: Encrypted TOTP secrets in database
- **Recovery Codes**: One-time use backup codes

#### Password Reset
- **Token Generation**: Cryptographically secure random tokens
- **Expiration**: Time-limited reset links
- **Single Use**: Tokens invalidated after use

### Authorization

#### Role-Based Access Control (RBAC)
- **Roles**: Owner, Admin, Member, Viewer
- **Permissions System**: Granular permission management
- **Team-Based**: Permissions scoped to team level

#### Resource Access Control
- **Documents**: Owner and team membership verification
- **Folders**: Hierarchical access inheritance
- **Data Rooms**: Explicit permission grants

---

## Link Sharing Security

### Token Security

#### Cryptographic Strength
- **Entropy**: 128-bit (22 characters)
- **Algorithm**: nanoid with URL-safe alphabet
- **Character Set**: 64 chars (a-z, A-Z, 0-9, -, _)
- **Collision Probability**: ~1 in 10^38

**Example Token**: `V1StGXR8_Z5jdHi6B-myT`

### Access Controls

#### Expiration Management
- **Default**: 7 days from creation
- **Custom**: User-configurable expiration date
- **Automatic**: Links expire automatically at configured time
- **Status**: Returns HTTP 410 (Gone) for expired links

#### View Limits
- **Max Views**: Configurable maximum number of accesses
- **Counter**: Incremented on each successful view
- **Enforcement**: Blocks access when limit reached
- **Unlimited**: Optional (null value)

#### Email Domain Restrictions
- **Whitelist**: Array of allowed email domains
- **Validation**: Server-side domain checking
- **Format**: `["company.com", "partner.com"]`
- **Bypass**: Requires domain match for access

#### Password Protection
- **Hashing**: bcrypt with salt
- **Verification**: Server-side password check
- **Transmission**: HTTPS only

#### Email Whitelist
- **Specific Emails**: Individual email allowlist
- **Verification**: Checked before granting access
- **Case-Insensitive**: Email matching

#### Link Revocation
- **Active Status**: `isActive` flag
- **Immediate**: Can be revoked at any time
- **Permanent**: Cannot be re-activated (create new link)

### Implementation Files
- `lib/security/token.ts` - Token generation
- `lib/security/link-access.ts` - Access validation
- `app/api/links/route.ts` - Link API

---

## File Upload & Storage Security

### File Validation

#### Type Whitelist
**Allowed Types**:
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Images**: PNG, JPG, JPEG, GIF, WEBP, SVG
- **Text**: TXT, CSV, JSON, Markdown
- **Archives**: ZIP, RAR

**Blocked Extensions**:
- Executables: `.exe`, `.dll`, `.bat`, `.sh`, `.cmd`, `.ps1`
- Scripts: `.js`, `.vbs`, `.jar`
- System Files: `.sys`, `.drv`
- Installers: `.msi`, `.deb`, `.rpm`, `.apk`, `.dmg`

#### Size Limits
- **Default Global**: 100 MB (104,857,600 bytes)
- **Team-Configurable**: Custom limits per team
- **Enforcement**: Server-side validation before upload
- **Storage**: `maxFileSize` field in teams table

#### MIME Type Verification
- **Magic Numbers**: Content-based file type detection
- **Library**: `file-type` npm package
- **Prevention**: Stops malicious file renaming (e.g., virus.exe → virus.pdf)
- **Validation**: Declared vs. actual content verification

### Filename Security

#### Sanitization
- **Path Traversal**: Removes `../`, `./`, `\`, `/`
- **Null Bytes**: Stripped (\0)
- **Unicode Normalization**: NFKC normalization (anti-homograph)
- **Control Characters**: Removed (0x00-0x1F, 0x7F)
- **Length Limit**: 255 characters maximum

#### Secure Storage Naming
- **Format**: `{teamId}/documents/{timestamp}-{random}-{sanitized}.ext`
- **Non-Enumerable**: Random component prevents guessing
- **User-Independent**: Users cannot control storage path

### Malware Scanning

#### Scanner Interface
- **Abstraction**: Multiple scanner support
- **Deferred Execution**: Async scanning to avoid blocking uploads

#### Supported Scanners

**ClamAV** (Open Source):
- **Configuration**: `CLAMAV_ENABLED=true`
- **Detection**: Signature-based malware detection
- **EICAR**: Standard test file detection implemented

**VirusTotal** (Cloud):
- **Configuration**: `VIRUSTOTAL_API_KEY=your_key`
- **API**: REST API integration ready
- **Multi-Engine**: 70+ antivirus engines

#### Scan Results
- **Status Values**: `pending`, `clean`, `infected`, `error`, `skipped`
- **Storage**: Scan metadata stored in `scanResult` JSON field
- **Blocking**: Infected files are rejected immediately
- **Logging**: Security events logged for audit

### Implementation Files
- `lib/security/file-validation.ts` - Validation logic
- `lib/security/malware-scanner.ts` - Scanner interface
- `app/api/documents/route.ts` - Upload API
- `app/api/documents/[id]/versions/route.ts` - Version API

---

## Data Protection

### Encryption

#### Data in Transit
- **Protocol**: TLS 1.2+ (HTTPS)
- **Certificates**: SSL/TLS certificates for all domains
- **Headers**: HSTS enabled (Strict-Transport-Security)

#### Data at Rest
- **Database**: PostgreSQL with encrypted storage (configurable)
- **File Storage**: S3/MinIO server-side encryption (SSE)
- **Passwords**: bcrypt hashed, never plaintext

### Privacy

#### Watermarking
- **Dynamic**: Viewer email + timestamp
- **Customizable**: Team-specific watermark text
- **Opacity**: Configurable (default 30%)
- **Prevention**: Deters unauthorized sharing

#### Screenshot Protection
- **CSS**: `user-select: none` for sensitive content
- **Events**: Context menu, copy, drag disabled
- **Limitations**: Browser-level only (not foolproof)

### Secure Document Viewing

#### Content Isolation
- **Viewer**: Sandboxed iframe for PDF/document rendering
- **CSP**: Content Security Policy headers (planned)
- **No Embedding**: Frame-ancestors restriction

---

## Access Control & Permissions

### Team-Level Security

#### Membership Validation
- **Check**: Every API request verifies team membership
- **Scope**: All operations limited to team resources
- **Isolation**: Teams cannot access other team's data

#### Role Permissions
- **Owner**: Full access, team management
- **Admin**: Resource management, user invitations
- **Member**: Create and edit resources
- **Viewer**: Read-only access

### Document-Level Security

#### Owner Verification
- **Creator**: Original uploader recorded
- **Modification**: Only owner and admins can modify
- **Deletion**: Restricted to owner and admins

#### Folder Hierarchy
- **Inheritance**: Permissions flow down folder tree
- **Parent Check**: Access verified at each level

### DataRoom Permissions

#### Explicit Grants
- **Model**: `DataRoomPermission`
- **Levels**: viewer, editor, admin
- **Email-Based**: Permissions assigned by email
- **Granular**: Per-dataroom access control

---

## Audit & Monitoring

### Audit Logging

#### Event Tracking
- **Actions**: created, updated, deleted, viewed, shared, downloaded
- **Resources**: document, folder, link, dataroom, team
- **Metadata**: JSON field for additional context
- **IP Address**: Request origin tracking
- **User Agent**: Client information

#### Log Storage
- **Table**: `audit_logs`
- **Indexed**: By team, user, resource, timestamp
- **Retention**: Configurable (default: indefinite)

### Analytics

#### Link View Tracking
- **Model**: `View`
- **Data Points**:
  - Viewer email/name
  - IP address, country, city
  - User agent (device, browser, OS)
  - Duration, completion rate
  - Download timestamp

#### Security Events
- **Failed Logins**: Tracked in session logs
- **Malware Detections**: Logged with threat info
- **Access Denials**: Link expiration, max views exceeded

---

## Infrastructure Security

### Database Security

#### PostgreSQL Hardening
- **Authentication**: Password-based (rotate regularly)
- **Network**: Restricted to application container
- **Encryption**: TLS for connections (configurable)
- **Backups**: Automated with encryption

#### Connection Security
- **Pooling**: Connection pooling with limits
- **Timeout**: Idle connection timeout
- **SSL**: Available for production deployments

### Container Security

#### Docker Best Practices
- **Non-Root**: Application runs as non-root user
- **Minimal Base**: Alpine Linux images
- **Health Checks**: Container health monitoring
- **Resource Limits**: CPU and memory constraints

### Secrets Management

#### Environment Variables
- **Sensitive Data**: Database credentials, API keys, auth secrets
- **Not Committed**: `.env` files in `.gitignore`
- **Production**: Use secret management service (AWS Secrets Manager, Azure Key Vault)

### Network Security

#### Reverse Proxy (nginx)
- **Rate Limiting**: Prevents brute force attacks
- **Request Size**: Limits to prevent DoS
- **Headers**: Security headers (X-Frame-Options, X-Content-Type-Options)

---

## Security Best Practices

### For Administrators

1. **Rotate Secrets**: Change AUTH_SECRET and database passwords regularly
2. **Enable 2FA**: For all admin accounts (when feature is active)
3. **Review Audit Logs**: Regularly check for suspicious activity
4. **Monitor Scans**: Track malware detection results
5. **Update Dependencies**: Keep npm packages and Docker images current
6. **Backup Data**: Regular encrypted backups of database

### For Users

1. **Strong Passwords**: Minimum 12 characters, mixed case, numbers, symbols
2. **Link Expiration**: Always set expiration for shared links
3. **Email Restrictions**: Use domain/email whitelists for sensitive documents
4. **Password Protection**: Add passwords to links containing confidential data
5. **Review Access**: Regularly check who has access to your datarooms

### For Developers

1. **Input Validation**: Always validate and sanitize user input
2. **Parameterized Queries**: Use Prisma ORM (prevents SQL injection)
3. **Authentication Check**: Verify user session in all API routes
4. **Authorization Check**: Verify permissions for all operations
5. **Error Handling**: Don't expose sensitive info in error messages
6. **Security Headers**: Implement CSP and other security headers
7. **Code Reviews**: Security-focused code review for critical features

---

## Security Incidents

### Reporting

If you discover a security vulnerability:

1. **Do Not** open a public GitHub issue
2. **Email**: security@dataroom.app (configure this)
3. **Include**: Detailed description and steps to reproduce
4. **Wait**: For acknowledgment before public disclosure

### Response Plan

1. **Triage**: Assess severity within 24 hours
2. **Patch**: Develop fix for critical vulnerabilities immediately
3. **Deploy**: Emergency deployment process for critical fixes
4. **Notify**: Inform affected users after patch deployment
5. **Post-Mortem**: Document incident and preventive measures

---

## Compliance & Standards

### Industry Standards

- **OWASP Top 10**: Addressed common web vulnerabilities
- **GDPR**: Data privacy and user consent (partial, configure for full compliance)
- **SOC 2**: Security controls framework (in progress)

### Data Residency

- **Storage Location**: Configurable (S3 region, Azure region)
- **Database Location**: Self-hosted or cloud provider choice

---

## Security Configuration

### Quick Reference

```bash
# Auth
NEXTAUTH_SECRET=<random-256-bit-secret>
AUTH_SECRET=<same-as-nextauth>

# Database
DATABASE_URL=postgresql://user:pass@host:port/db?ssl=true

# File Security
CLAMAV_ENABLED=true  # Enable malware scanning
VIRUSTOTAL_API_KEY=<your-key>  # Alternative scanner

# Team Defaults (set in database)
maxFileSize=104857600  # 100MB
allowedFileTypes=["application/pdf",...]  # Custom whitelist
```

### Security Checklist

- [ ] Change default AUTH_SECRET
- [ ] Enable HTTPS in production
- [ ] Configure malware scanner
- [ ] Set up audit log monitoring
- [ ] Configure backup encryption
- [ ] Review team file upload limits
- [ ] Enable 2FA for admins
- [ ] Set up security alerting

---

## Changelog

### 2025-11-27 - Security Enhancements v1.0
- ✅ 128-bit link tokens
- ✅ Link expiration (7-day default)
- ✅ Max views limit for links
- ✅ Email domain restrictions
- ✅ File type whitelist
- ✅ File size limits (team-configurable)
- ✅ Filename sanitization
- ✅ MIME type verification
- ✅ Malware scanner interface

### Previous Features
- Password protection for links
- Email whitelist for links
- RBAC permissions system
- Audit logging
- View analytics
- Watermarking
- Team isolation

---

## Additional Resources

- **Setup Guide**: [`docs/SECURITY_SETUP.md`](./SECURITY_SETUP.md)
- **Implementation Details**: See walkthrough artifact
- **API Documentation**: Coming soon
- **Security Headers**: Configure in nginx/middleware

---

**Security is a continuous process. This document will be updated as new security features are added.**

For questions or concerns, contact the security team.
