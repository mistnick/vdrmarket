# VDR (Virtual Data Room) System

## Overview

The Virtual Data Room (VDR) system extends the existing DataRoom platform with enterprise-grade access control, granular permissions, and comprehensive user management capabilities.

## Key Features

### 🔐 Advanced Access Control
- **Group-based Permissions**: Three group types (ADMINISTRATOR, USER, CUSTOM)
- **User-level Overrides**: Granular control per user per resource
- **Time-based Access**: Define access windows for temporary access
- **IP Restrictions**: Whitelist specific IPs or ranges
- **2FA Integration**: Require two-factor authentication

### 👥 User Management
- **Invitation System**: Secure token-based user invitations via email
- **User Status**: PENDING_INVITE, ACTIVE, DEACTIVATED, EXPIRED
- **Access Types**: UNLIMITED or LIMITED (time-based)
- **Bulk Operations**: Manage multiple users efficiently

### 📁 Document & Folder Permissions
- **Granular Control**: 7 permission types per resource
  - Fence View
  - View
  - Download (Encrypted, PDF, Original)
  - Upload
  - Manage
- **Permission Aggregation**: OR logic for group permissions
- **User Overrides**: Complete override of group permissions

### 🗑️ Recycle Bin
- **Soft Delete**: Documents and folders can be restored
- **Admin Control**: Only administrators can access recycle bin
- **Permanent Delete**: Final deletion with confirmation

### 📊 Activity & Reports
- **Scope-based Viewing**: Self, group, or all activity
- **Advanced Filters**: Date range, action type, resource type
- **Audit Trail**: Complete activity logging

### ✅ Due Diligence
- **Checklists**: Create and manage due diligence checklists
- **Item Tracking**: Mark items complete with user and timestamp
- **Permission Control**: Configurable visibility per group

## Architecture

### Database Schema

**New Tables (9):**
- `Group` - User groups with permissions
- `GroupMember` - Group membership
- `UserInvitation` - Invitation tokens
- `DocumentGroupPermission` - Document permissions for groups
- `DocumentUserPermission` - Document permissions for users
- `FolderGroupPermission` - Folder permissions for groups
- `FolderUserPermission` - Folder permissions for users
- `DueDiligenceChecklist` - Checklists
- `DueDiligenceItem` - Checklist items

**Extended Tables (4):**
- `User` - Added status, access control fields
- `DataRoom` - Added VDR settings
- `Document` - Added soft delete
- `Folder` - Added soft delete

### Backend Services

**`lib/vdr/authorization.ts`**
- Permission matrix implementation
- Group type checks (ADMINISTRATOR, USER, CUSTOM)
- 15+ authorization functions

**`lib/vdr/document-permissions.ts`**
- Permission resolution with OR logic
- User override support
- Helper functions for permission checks

**`lib/vdr/user-access.ts`**
- User status validation
- Time window checks
- IP restriction validation
- 2FA enforcement

**`lib/vdr/middleware.ts`**
- Access validation middleware
- IP extraction
- 2FA status checking

**`lib/vdr/email-service.ts`**
- Invitation email templates
- Password reset emails
- Mock mode for development

### API Endpoints (28)

See [VDR_API.md](./VDR_API.md) for complete documentation.

**Groups:** 7 endpoints
**Users:** 5 endpoints
**Permissions:** 5 endpoints
**Recycle Bin:** 3 endpoints
**Activity:** 1 endpoint
**Due Diligence:** 3 endpoints
**Settings:** 3 endpoints

### Frontend Components (11)

**Group Management:**
- `GroupList` - Grid display of groups
- `GroupFormDialog` - Create/edit groups

**User Management:**
- `UserList` - Table display of users
- `InviteUserDialog` - Full invitation form

**Permissions:**
- `PermissionEditorDialog` - Tabbed permission editor

**Activity:**
- `ActivityLogView` - Filterable activity log

**Recycle Bin:**
- `RecycleBin` - Deleted items management

**Main:**
- `VDRManagementPage` - Complete management interface

## Installation & Setup

### 1. Database Migration

The VDR schema is already applied via migration `20251128_add_vdr_system`.

If needed, regenerate Prisma client:
```bash
npx prisma generate
```

### 2. Environment Variables

Add to `.env`:
```env
# Email Service (optional, uses mock if not set)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
```

### 3. Create Initial Groups

For each data room, create at least:
1. **ADMINISTRATOR** group
2. **USER** group (optional)

### 4. Invite First Administrator

Use the invitation API to invite the first administrator and assign them to the ADMINISTRATOR group.

## Usage

### Creating a New Data Room with VDR

1. Create data room (existing flow)
2. Create ADMINISTRATOR group
3. Invite administrators
4. Create additional groups as needed
5. Configure data room settings (Q&A, Due Diligence)
6. Set document/folder permissions

### Managing Users

1. **Invite**: POST to `/api/vdr/[dataRoomId]/users/invite`
2. **User Activates**: User clicks email link, sets password
3. **Manage**: Update status, access windows, IP restrictions
4. **Deactivate**: DELETE user (soft deactivation)

### Setting Permissions

1. Navigate to document/folder
2. Click "Manage Permissions"
3. Set group permissions (applies to all group members)
4. Set user overrides (optional, overrides group permissions)
5. Save

### Viewing Activity

1. Navigate to Activity tab
2. Select scope (self/group/all)
3. Apply filters (date, action, resource)
4. Export if needed

## Permission Resolution

### Group Permissions (OR Logic)

If a user is in multiple groups, they get the **union** of all permissions:
- Group A: canView, canDownloadPdf
- Group B: canView, canDownloadOriginal
- **Result**: canView, canDownloadPdf, canDownloadOriginal

### User Overrides (Complete Override)

User-specific permissions **completely replace** group permissions:
- Groups: canView, canDownloadPdf
- User Override: canView, canManage
- **Result**: canView, canManage (PDF permission removed)

## Testing

### Run Tests

```bash
npm test
```

### Test Coverage

- **Unit Tests**: 65+ test cases
  - Authorization (30+)
  - User Access (20+)
  - Document Permissions (15+)
- **Integration Tests**: 10+ test cases
  - API endpoints

### Test Files

- `__tests__/lib/vdr/authorization.test.ts`
- `__tests__/lib/vdr/user-access.test.ts`
- `__tests__/lib/vdr/document-permissions.test.ts`
- `__tests__/api/vdr/groups.test.ts`

## Security Considerations

### Access Control
- ✅ All endpoints require authentication
- ✅ Permission checks on every operation
- ✅ User status validation
- ✅ IP restrictions supported
- ✅ 2FA integration points

### Data Protection
- ✅ Soft delete prevents accidental data loss
- ✅ Audit logging for compliance
- ✅ Email notifications for invitations
- ✅ Secure token generation (32 bytes)

### Best Practices
1. Always use HTTPS in production
2. Implement rate limiting
3. Enable 2FA for administrators
4. Regular security audits
5. Monitor activity logs

## Troubleshooting

### Lint Errors about Missing Prisma Models

Run `npx prisma generate` to regenerate the Prisma client after schema changes.

### Email Not Sending

Check:
1. `EMAIL_PROVIDER` is set to "smtp"
2. SMTP credentials are correct
3. SMTP_PORT matches server (usually 587 or 465)
4. Firewall allows SMTP connections

For development, emails are logged to console in mock mode.

### Permission Denied Errors

Verify:
1. User is in correct groups
2. Group has required permissions
3. User status is ACTIVE
4. Access window is valid (if LIMITED)
5. IP is allowed (if restricted)

## Future Enhancements

Potential improvements:
- [ ] CIDR range support for IP restrictions
- [ ] Advanced 2FA with TOTP
- [ ] Permission templates
- [ ] Bulk user import
- [ ] Advanced reporting and analytics
- [ ] Email notification preferences
- [ ] Mobile app support

## Support

For issues or questions:
1. Check [VDR_API.md](./VDR_API.md) for API documentation
2. Review test files for usage examples
3. Check console logs for detailed errors

## License

Same as main DataRoom application.
