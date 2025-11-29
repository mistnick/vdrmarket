# DataRoom VDR - Project Status & Architecture

**Last Updated**: 2025-11-29  
**Version**: 3.0.0 - DataRoom-based Architecture  
**Status**: 🟢 Active Development - Architecture Restructured

---

## 📊 Project Overview

DataRoom VDR is a Virtual Data Room platform for secure document sharing with advanced tracking, analytics, and granular permission control. The system has been restructured to use a DataRoom-centric architecture.

### Architecture Summary

```
DataRoom (root entity)
├── Groups (ADMINISTRATOR, USER, CUSTOM)
│   └── GroupMembers (users with roles: owner, admin, member, viewer)
├── Documents
│   ├── DocumentGroupPermission (per-group permissions)
│   └── DocumentUserPermission (per-user overrides)
├── Folders
│   ├── FolderGroupPermission (per-group permissions)
│   └── FolderUserPermission (per-user overrides)
└── UserInvitation (pending invitations)
```

### Quick Stats
- **Start Date**: November 2025
- **Current Phase**: Phase 2 - Core VDR Features
- **Repository**: [mistnick/vdrmarket](https://github.com/mistnick/vdrmarket)
- **Branch**: main

---

## ✅ Completed Features

### 🏗️ Core Infrastructure
- ✅ Next.js 15 with App Router
- ✅ TypeScript (strict mode)
- ✅ Prisma ORM with PostgreSQL
- ✅ Docker configuration (dev + production)
- ✅ Custom session-based authentication
- ✅ Storage abstraction (S3/Azure)

### 🔐 Authentication System
- ✅ Custom session management (database-backed)
- ✅ Login/Logout APIs
- ✅ Password security (bcrypt)
- ✅ Session cookies (httpOnly, secure, 7 days)
- ✅ Middleware protection

### 📧 Email Service
- ✅ Resend integration
- ✅ Email templates (invitations, notifications)
- ✅ Document sharing notifications

### 🗄️ DataRoom-based Architecture (NEW)
- ✅ DataRoom as root entity (replaces Team)
- ✅ Groups with types: ADMINISTRATOR, USER, CUSTOM
- ✅ GroupMembers with roles: owner, admin, member, viewer
- ✅ Document/Folder Group Permissions
- ✅ Document/Folder User Permissions (overrides)
- ✅ User Invitations system
- ✅ Permission seeding script

### 📁 Document Management
- ✅ Document CRUD operations
- ✅ Folder management
- ✅ Version control
- ✅ Metadata management
- ✅ Tags system
- ✅ Move/copy operations

### 🔗 Link Sharing
- ✅ Shareable links with slugs
- ✅ Password protection
- ✅ Email verification
- ✅ Expiration dates
- ✅ Download options control

### 📊 Analytics
- ✅ View tracking
- ✅ Device/geo detection
- ✅ Audit logging

---

## 🎯 Permission Model

### Group Permissions
Each group can have specific permissions on documents/folders:

| Permission | Description |
|------------|-------------|
| `canFence` | Access restriction |
| `canView` | View document |
| `canDownloadEncrypted` | Download encrypted version |
| `canDownloadPdf` | Download as PDF |
| `canDownloadOriginal` | Download original file |
| `canUpload` | Upload new versions |
| `canManage` | Full management access |

### Default Permission Presets

**ADMINISTRATOR Group:**
- All permissions enabled

**USER Group:**
- canView, canDownloadEncrypted, canDownloadPdf

**CUSTOM Group:**
- canView only (configure as needed)

### Role-based Permissions (GroupMember roles)

| Role | Permissions |
|------|-------------|
| `owner` | Full access to everything |
| `admin` | Full access except delete DataRoom |
| `member` | View, create, edit documents |
| `viewer` | View only |

---

## 🐳 Docker Configuration

### Development
```bash
docker-compose up -d
```
Services: postgres, minio, redis, app

### Production
```bash
docker-compose -f docker-compose.production.yml up -d
```
Services: postgres, redis, app, nginx, certbot

### Key Commands
```bash
# Database
npm run db:seed              # Seed users and data
npm run db:seed:permissions  # Seed groups and permissions

# Deploy
./scripts/deploy-production.sh

# Logs
docker-compose logs -f app
```

---

## 📁 Project Structure

```
/app
  /api
    /datarooms/[id]/...     # DataRoom CRUD
    /documents/[id]/...     # Document operations
    /folders/[id]/...       # Folder operations
    /groups/...             # Group management
    /users/...              # User management
  /(dashboard)/...          # Dashboard pages
  /auth/...                 # Auth pages
  /view/[slug]              # Public viewer

/components
  /datarooms/               # DataRoom components
  /documents/               # Document components
  /folders/                 # Folder components
  /vdr/                     # VDR-specific components

/lib
  /auth/
    session.ts              # Session management
    permissions.ts          # Permission utilities
  /db/
    prisma.ts               # Prisma client

/prisma
  schema.prisma             # Database schema
  seed.ts                   # Main seed script
  seed-permissions.ts       # Permission seeding
```

---

## 🔧 Environment Variables

### Required
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
AUTH_SECRET=...
```

### Storage (S3/MinIO)
```env
STORAGE_PROVIDER=s3
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
AWS_ENDPOINT=...  # For MinIO
```

### Email (Optional)
```env
RESEND_API_KEY=...
EMAIL_FROM=...
```

---

## 📅 Recent Changes

### 2025-11-29: Architecture Restructure v3.0.0
- ❌ Removed Team entity
- ✅ DataRoom as root container
- ✅ Groups with types (ADMINISTRATOR, USER, CUSTOM)
- ✅ GroupMembers with roles
- ✅ Granular document/folder permissions
- ✅ Updated all API routes (~20+ files)
- ✅ Permission seeding script
- ✅ Docker configuration updated
- ✅ Deployment script updated

### 2025-11-21: Authentication Refactor
- ✅ Removed NextAuth
- ✅ Custom session management
- ✅ Simplified login flow

---

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/mistnick/vdrmarket.git
cd vdrmarket
npm install
```

### 2. Setup Database
```bash
docker-compose up -d postgres redis minio
cp .env.example .env
# Edit .env with your settings
npm run db:push
npm run db:seed
npm run db:seed:permissions
```

### 3. Run Development
```bash
npm run dev
```

### 4. Access
- App: http://localhost:3000
- MinIO Console: http://localhost:9101

---

## 📚 Documentation Index

| Document | Description |
|----------|-------------|
| [VDR_README.md](./VDR_README.md) | VDR feature overview |
| [VDR_API.md](./VDR_API.md) | API documentation |
| [VDR_ADMIN_GUIDE.md](./VDR_ADMIN_GUIDE.md) | Admin guide |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment guide |
| [AUTH-SYSTEM.md](./AUTH-SYSTEM.md) | Auth documentation |
| [DATABASE-SETUP.md](./DATABASE-SETUP.md) | Database setup |

---

## 🎯 Next Steps

1. **UI Updates** - Update frontend for DataRoom-based architecture
2. **Permission UI** - Document/Folder permission management interface
3. **Group Management** - UI for creating and managing groups
4. **User Invitations** - Complete invitation workflow UI
5. **Testing** - E2E tests for new architecture

---

**Status**: 🟢 Build Passing  
**Last Build**: 2025-11-29  
**Docker**: Ready
