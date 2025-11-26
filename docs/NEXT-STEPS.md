# DataRoom VDR - Next Steps

**Last Updated:** 2025-11-24  
**Current Phase:** Phase 3 (Advanced DMS & Collaboration) - COMPLETED ✅  
**Next Phase:** Phase 4 (Advanced Features & Optimization)

---

## 🎉 Completed Features (Phases 2 & 3)

### Phase 2: Security Hardening ✅ **100% COMPLETE**

#### ✅ Two-Factor Authentication (2FA)
- TOTP-based authentication with QR code
- Recovery codes (SHA-256 hashed)
- Enable/disable/verify API endpoints
- 3-step setup wizard UI
- **Status:** Production ready

#### ✅ Enhanced Session Management
- Session metadata tracking (IP, device, browser, OS)
- Active sessions viewer UI
- Individual & bulk session revocation
- Next.js 15 async compatibility
- **Status:** Production ready

#### ✅ Secure Document Viewer (DRM)
- Dynamic watermarks with timestamp
- Print/download/copy protection
- Context menu & keyboard blocking
- Page-by-page PDF rendering
- **Status:** Production ready

#### ✅ Enhanced Audit Logging
- Comprehensive event tracking
- Advanced filtering & search
- CSV/JSON export
- Audit log viewer UI with pagination
- **Status:** Production ready

### Phase 3: Advanced DMS & Collaboration ✅ **100% COMPLETE**

#### ✅ Document Versioning System
- Full version history tracking
- Version rollback/restore
- Version comments
- Storage provider integration
- Timeline UI component
- **Status:** Production ready

#### ✅ Q&A System
- Question/Answer/QACategory models
- Bidder isolation for M&A deals
- Questions API with filtering
- Answers API with status updates
- Category management UI with color coding
- Q&A viewer UI with filters
- Excel/PDF export functionality
- **Status:** Production ready

#### ✅ Advanced Metadata & Tags
- Custom metadata fields (text, number, date, boolean, select)
- Tag system with color coding
- Document-tag associations
- Metadata/tag CRUD APIs
- Metadata editor UI component
- Tag selector with autocomplete
- Advanced search UI with filter builder
- **Status:** Production ready

#### ✅ Document Comments & Collaboration
- Threaded comment system
- @mentions extraction
- Public/private comments
- Comment mentions tracking
- Comments API
- Comments panel UI with threading
- **Status:** Production ready

---

## Immediate Priorities (Next 2-4 Weeks)

### 🎨 Priority 1: Complete UI Components
**Why:** Core APIs built, need user-facing interfaces

**Tasks:**
- [ ] Q&A category management UI
- [x] Q&A viewer UI with filters
- [ ] Q&A export (Excel/PDF)
- [x] Metadata editor UI component
- [x] Tag selector with autocomplete
- [x] Advanced search UI
- [x] Comments panel UI component

**Effort:** 5-7 days  
**Priority:** P0 (Critical)

---

### 📊 Priority 2: Advanced Search & Filtering
**Why:** With tags/metadata, users need powerful search

## Phase 4: Advanced Features & Real-time Collaboration (In Progress - 70% Complete)

### Completed Features ✅

#### Real-time Notifications Foundation
- [x] Redis infrastructure setup
- [x] Notification model & API
- [x] WebSocket server (Socket.IO)
- [x] Notification Bell UI
- [x] Full notification history page with filtering
- [x] Notification preferences system with database schema
- [x] Email/In-app/Desktop notification controls
- [x] Notification digest settings

#### Full-text Search Backend
- [x] PostgreSQL tsvector migration
- [x] Search API with ranking
- [x] Enhanced global search with keyboard shortcuts (Cmd/Ctrl+K)
- [x] Search result highlighting
- [x] Advanced search dialog with filters
- [x] Search history tracking
- [x] CSV export of search results

#### Email System Foundation
- [x] Email service abstraction
- [x] Basic templates (Welcome, Invite, Notification)
- [x] Team invitation email integration
- [x] Notification preferences API

### Remaining Tasks (Next Step)

#### Search UI Enhancement
- [ ] **Test search performance with large datasets**

#### Notification System
- [ ] Add real-time notification updates via WebSocket
- [ ] Test WebSocket connection stability
- [ ] Test desktop notification permissions

#### Email Integration
- [ ] Connect email service to document sharing events
- [ ] Connect email service to notification events (based on preferences)
- [ ] Implement notification digest emails (daily/weekly)
- [ ] Create email preview/test functionality

#### Real-time Updates
- [ ] Update dashboard with live WebSocket updates
- [ ] Test document updates propagation
- [ ] Verify multi-tab synchronization

#### Database & Deployment
- [ ] Run database migration for NotificationPreference model (requires migration reset)
- [x] Fix Next.js build Html import error
- [x] Rebuild Docker containers
- [x] End-to-end testing

**Effort:** 3-5 days remaining  
**Priority:** P1 (High)

---

## Immediate Priorities (Next 2-4 Weeks)

### 🔐 Priority 1: Two-Factor Authentication (2FA)
**Why:** Critical security requirement for enterprise customers, table stakes for M&A deals

**Implementation Steps:**
1. ✅ UI component already exists (`components/settings/two-factor-auth-dialog.tsx`)
2. [ ] Backend API implementation
   - [ ] Generate TOTP secrets (using `otplib` or `speakeasy`)
   - [ ] QR code generation endpoint
   - [ ] Verification endpoint
   - [ ] Recovery codes generation
3. [ ] Database schema update
   - [ ] Add `twoFactorEnabled`, `twoFactorSecret` to User model
   - [ ] Create `RecoveryCode` model
4. [ ] Login flow modification
   - [ ] Check if 2FA enabled after password verification
   - [ ] 2FA verification step
   - [ ] Recovery code fallback
5. [ ] Testing
   - [ ] Unit tests for TOTP generation/verification
   - [ ] E2E test for 2FA setup and login

**Effort:** 3-5 days  
**Priority:** P0 (Critical)

---

### 🔒 Priority 2: Enhanced Session Management
**Why:** Security best practice, prevents session hijacking, required for enterprise

**Implementation Steps:**
1. [ ] Refresh token rotation
   - [ ] Generate refresh tokens alongside access tokens
   - [ ] Rotate on each use
   - [ ] Store in secure HTTP-only cookies
2. [ ] Session tracking
   - [ ] Store session metadata (IP, device, browser, location)
   - [ ] Create `Session` database model
   - [ ] Link sessions to users
3. [ ] Active sessions UI
   - [ ] Display all user sessions in Settings
   - [ ] Force logout individual sessions
   - [ ] Force logout all other sessions
4. [ ] Concurrent session limits (optional)
   - [ ] Configure max sessions per user
   - [ ] Auto-revoke oldest sessions

**Effort:** 4-6 days  
**Priority:** P0 (Critical)

---

### 👁️ Priority 3: Secure Document Viewer Foundation
**Why:** Core DRM differentiator, prevents unauthorized distribution

**Implementation Steps:**
1. [ ] Watermark overlay component
   - [ ] Dynamic watermark (username, email, IP, timestamp)
   - [ ] Configurable opacity and positioning
   - [ ] Prevent inspector DOM manipulation
2. [ ] Screenshot prevention
   - [ ] Animated watermark overlay
   - [ ] Detect screen capture APIs
   - [ ] Blur content on window blur (basic protection)
3. [ ] Viewer controls
   - [ ] Disable print (CSS + JS)
   - [ ] Disable download button
   - [ ] Disable right-click context menu
   - [ ] Prevent text selection/copy
4. [ ] Page-by-page rendering
   - [ ] Lazy load pages
   - [ ] Clear previous page from memory
   - [ ] Track page views in analytics

**Effort:** 5-7 days  
**Priority:** P1 (High)

---

### 📊 Priority 4: Enhanced Audit Logging
**Why:** Compliance requirement (GDPR, SOC2), builds trust with enterprise

**Implementation Steps:**
1. [ ] Expand audit event types
   - [ ] LOGIN, LOGOUT, LOGIN_FAILED
   - [ ] DOCUMENT_VIEWED, DOCUMENT_DOWNLOADED, DOCUMENT_PRINTED
   - [ ] PERMISSION_CHANGED, USER_INVITED, USER_REMOVED
   - [ ] Q&A_CREATED, Q&A_ANSWERED
2. [ ] Capture detailed metadata
   - [ ] IP address, user agent, device type
   - [ ] Document ID, folder ID, duration
   - [ ] Before/after state for changes
3. [ ] Audit log viewer UI
   - [ ] Filterable table (user, date, action, resource)
   - [ ] Export to CSV/JSON
   - [ ] Search functionality
4. [ ] Retention policy
   - [ ] Configurable retention period
   - [ ] Automatic archival/deletion

**Effort:** 4-5 days  
**Priority:** P1 (High)

---

## Technical Preparation Tasks

### Database Migrations
- [ ] Add 2FA fields to User model
- [ ] Create RecoveryCode model
- [ ] Create Session model
- [ ] Expand AuditLog model with new event types
- [ ] Add indexes for performance

### Dependencies to Install
```bash
npm install otplib qrcode speakeasy
npm install @types/qrcode @types/speakeasy --save-dev
```

### API Endpoints to Create
- `POST /api/auth/2fa/enable` - Generate secret, return QR code
- `POST /api/auth/2fa/verify` - Verify TOTP code
- `POST /api/auth/2fa/disable` - Disable 2FA
- `GET /api/auth/sessions` - List active sessions
- `DELETE /api/auth/sessions/:id` - Revoke specific session
- `GET /api/audit-logs` - Fetch audit logs with filters
- `GET /api/audit-logs/export` - Export logs as CSV

---

## Quick Wins (Can be done in parallel)

### 1. Password Policy Enforcement
- [ ] Add password strength validation
- [ ] Minimum length (12 chars)
- [ ] Require uppercase, lowercase, number, special char
- [ ] Password history (prevent reuse of last 5)
- [ ] Display strength meter on password input

**Effort:** 1-2 days

### 2. IP Restrictions (Basic)
- [ ] Add `allowedIPs` array to Team model
- [ ] Middleware to check IP against allowlist
- [ ] Admin UI to manage allowed IPs
- [ ] Support CIDR notation

**Effort:** 2-3 days

### 3. File Upload Improvements
- [ ] Support ZIP extraction
- [ ] Preserve folder structure on upload
- [ ] Progress bar for large uploads
- [ ] Parallel chunk upload

**Effort:** 3-4 days

---

## Success Criteria (End of Phase 2)

### Security
- ✅ 2FA enabled for 80%+ of admin users
- ✅ Zero security incidents
- ✅ Session hijacking protection in place
- ✅ All actions logged in audit trail

### Performance
- ✅ 99.5%+ uptime
- ✅ \<200ms API response time (p95)
- ✅ \<100ms audit log queries

### Compliance
- ✅ GDPR-compliant data handling
- ✅ SOC 2 Type 1 ready (foundations)
- ✅ Complete audit log export capability

### User Experience
- ✅ Seamless 2FA setup (\<2 minutes)
- ✅ Secure viewer renders documents smoothly
- ✅ No user-facing security friction

---

## After Phase 2 (Preview Phase 3)

### Advanced Document Management
- OCR integration for searchable PDFs
- Document versioning with diff view
- Custom metadata fields
- Advanced tag system
- Bulk operations (move, rename, permissions)

### Q&A System
- Complete Q&A workflow
- Bidder isolation
- Category-based routing
- Email notifications
- Excel/PDF export

### Collaboration
- Document comments
- @mentions
- Activity feeds
- Real-time notifications

---

## Resources & Timeline

**Team Size:** 3-4 developers  
**Duration:** 4-6 weeks for core Phase 2 features  
**Parallel Work Streams:**
- Stream 1: 2FA + Session Management (1-2 devs)
- Stream 2: Secure Viewer + DRM (1 dev)
- Stream 3: Audit Logging + Compliance (1 dev)

**Risk Factors:**
- 2FA complexity (testing with authenticator apps)
- Secure viewer browser compatibility
- Audit log performance at scale

---

## Starting Point: Implement 2FA (This Week)

### Day 1-2: Backend Foundation
1. Install dependencies (`otplib`, `qrcode`)
2. Update Prisma schema for 2FA fields
3. Create API endpoints for 2FA setup
4. Implement TOTP generation and verification

### Day 3-4: Frontend Integration
1. Connect existing 2FA dialog to backend
2. Display QR code for authenticator apps
3. Verify TOTP code input
4. Show recovery codes after setup

### Day 5: Testing & Refinement
1. Test with Google Authenticator, Authy, 1Password
2. Test recovery code flow
3. Update login flow to check for 2FA
4. E2E tests

**Next Commit:** "`feat: implement two-factor authentication (TOTP)`"

---

Let's start building! 🚀
