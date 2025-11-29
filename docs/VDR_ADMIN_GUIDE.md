# VDR Admin User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Managing Groups](#managing-groups)
3. [Managing Users](#managing-users)
4. [Setting Permissions](#setting-permissions)
5. [Activity Monitoring](#activity-monitoring)
6. [Recycle Bin](#recycle-bin)
7. [Due Diligence](#due-diligence)
8. [Best Practices](#best-practices)

## Getting Started

### Accessing VDR Management

1. Navigate to your Data Room
2. Click on the **VDR** tab in the sidebar
3. You'll see three main tabs: Groups, Users, Activity

### Prerequisites

To manage VDR features, you need:
- **ADMINISTRATOR** group membership
- Or specific permissions like `canManageUsers`

## Managing Groups

### Creating a Group

1. Go to **Groups** tab
2. Click **Create Group**
3. Fill in:
   - **Name**: Descriptive group name
   - **Type**: ADMINISTRATOR, USER, or CUSTOM
   - **Description**: Optional details
   - **Permissions**: (for CUSTOM groups only)
4. Click **Create**

### Group Types

**ADMINISTRATOR**
- Full system access
- Cannot modify permissions (always has all)
- Recommended: 2-5 administrators maximum

**USER**
- Standard document access
- Optional permissions:
  - View due diligence checklist
  - View group users
  - View group activity

**CUSTOM**
- Fully configurable
- Recommended for specific roles:
  - "External Auditors"
  - "Legal Team"
  - "Read-Only Investors"

### Editing Groups

1. Find group in list
2. Click **Edit** button
3. Update fields
4. Click **Save**

**Note**: Cannot change group type after creation

### Deleting Groups

1. Click **Delete** on group card
2. Confirm deletion
3. Users in that group retain access through other groups

**Warning**: Cannot delete ADMINISTRATOR groups

## Managing Users

### Inviting Users

1. Go to **Users** tab
2. Click **Invite User**
3. Enter email address
4. Select group(s) to assign
5. Configure access:
   - **Access Type**: UNLIMITED or LIMITED
   - **Start Date**: When access begins (optional)
   - **End Date**: When access expires (optional)
   - **Require 2FA**: Enforce two-factor authentication
   - **Allowed IPs**: Restrict to specific IPs (optional)
6. Click **Send Invitation**

The user receives an email with activation link.

### User Activation Flow

1. User receives invitation email
2. Clicks activation link
3. Sets password (minimum 8 characters)
4. Account becomes ACTIVE
5. Can immediately access the data room

### User Status

**PENDING_INVITE**
- Invitation sent but not activated
- Cannot access system
- Can resend invitation

**ACTIVE**
- Account activated
- Can access based on permissions
- Subject to access window and IP restrictions

**DEACTIVATED**
- Manually deactivated by admin
- Cannot access system
- Can be reactivated

**EXPIRED**
- Access window has passed
- Cannot access system
- Update access dates to reactivate

### Updating User Access

1. Find user in list
2. Click **Edit Settings**
3. Modify:
   - Status
   - Access type and dates
   - IP restrictions
   - 2FA requirement
4. Click **Save**

### Deactivating Users

1. Find user
2. Click **Deactivate**
3. Confirm action
4. User immediately loses access

**Note**: This is soft deletion - can be reversed

## Setting Permissions

### Document Permissions

1. Navigate to document in File Explorer
2. Right-click → **Manage Permissions**
3. See two tabs:
   - **Group Permissions**
   - **User Overrides**

### Group Permissions

Set permissions for entire groups:

**Permission Types:**
- **Fence View**: View with watermark/protection
- **View**: Standard view access
- **Download Encrypted**: Download encrypted version
- **Download PDF**: Download as PDF
- **Download Original**: Download original file
- **Upload**: Upload new versions
- **Manage**: Full control including deletion

**Setting Group Permissions:**
1. Find group in table
2. Check desired permissions
3. Click **Save**

**Important**: Group permissions use OR logic
- User in multiple groups gets union of all permissions
- Example: Group A (view, download PDF) + Group B (view, manage) = view, download PDF, manage

### User Overrides

Override group permissions for specific users:

1. Switch to **User Overrides** tab
2. Click **Add User Override**
3. Select user
4. Set permissions (completely replaces group permissions)
5. Click **Add Override**

**Important**: User overrides REPLACE group permissions entirely
- Group: view, download PDF
- Override: view, manage
- Result: User has ONLY view and manage (no download PDF)

### Folder Permissions

Same process as documents:
- Permissions apply to folder and all contents
- Child documents inherit folder permissions
- Can override at document level

## Activity Monitoring

### Viewing Activity

1. Go to **Activity** tab
2. Select scope:
   - **My Activity**: Only your actions
   - **Group Activity**: Actions by your group members
   - **All Activity**: Everything (admin only)

### Filtering Activity

Use filters to narrow down:
- **Date Range**: Start and end dates
- **Action**: create, update, delete, view, download
- **Resource Type**: document, folder, user, group

### Exporting Activity

1. Apply desired filters
2. Click **Export**
3. Download CSV file

**Use Cases:**
- Compliance audits
- Security reviews
- User behavior analysis

## Recycle Bin

**Admin Only Feature**

### Viewing Deleted Items

1. Navigate to Recycle Bin section
2. See two tabs:
   - Documents
   - Folders

### Restoring Items

1. Find deleted item
2. Click **Restore**
3. Confirm
4. Item returns to original location

### Permanent Deletion

1. Find item
2. Click **Delete Permanently**
3. Confirm (cannot be undone)

**Warning**: Permanently deleting a folder deletes all contents

## Due Diligence

### Creating Checklists

1. Navigate to Due Diligence
2. Click **Create Checklist**
3. Enter:
   - Name
   - Description
   - Items (title, description, order)
4. Click **Create**

### Managing Checklist Items

Users with permission can:
- View checklist
- Mark items complete
- See who completed items and when

**Admin Features:**
- Create new checklists
- Edit existing items
- Delete checklists

## Best Practices

### Group Structure

**Recommended Setup:**
```
ADMINISTRATOR (2-3 people)
├── Full system access
└── Emergency access

USER - Internal Team
├── View documents
├── Download PDFs
└── View activity

CUSTOM - External Auditors
├── View documents
├── Download originals
└── View due diligence

CUSTOM - Investors (Read-Only)
└── View documents only
```

### Permission Strategy

1. **Start Restrictive**: Grant minimum permissions
2. **Use Groups**: Avoid excessive user overrides
3. **Document Reasons**: Note why permissions granted
4. **Regular Reviews**: Audit permissions quarterly
5. **Remove Promptly**: Deactivate users when project ends

### Security

**Strong Practices:**
- ✅ Enable 2FA for all administrators
- ✅ Use IP restrictions for sensitive data
- ✅ Set expiration dates for temporary access
- ✅ Monitor activity logs weekly
- ✅ Use LIMITED access for contractors

**Avoid:**
- ❌ Sharing administrator accounts
- ❌ Leaving expired users active
- ❌ Granting permissions "just in case"
- ❌ Ignoring activity anomalies

### User Lifecycle

**Onboarding:**
1. Create invitation with appropriate group
2. Set access window if temporary
3. Enable 2FA if handling sensitive data
4. Document reason for access

**Offboarding:**
1. Deactivate user immediately
2. Review their activity logs
3. Transfer ownership of their documents
4. Archive or delete if necessary

### Troubleshooting

**User can't access document:**
1. Check user status (must be ACTIVE)
2. Verify group permissions
3. Check for user overrides (may restrict)
4. Verify access window if LIMITED
5. Check IP restrictions

**Permission changes not working:**
1. User overrides replace group permissions
2. Check cache (may need logout/login)
3. Verify you have permission to change permissions

**Email not received:**
1. Check spam/junk folders
2. Verify email address correct
3. Check email service configuration
4. Resend invitation

## Support

For technical issues:
1. Check [VDR_README.md](./VDR_README.md)
2. Review [VDR_API.md](./VDR_API.md)
3. Contact system administrator

For security concerns:
1. Contact administrator immediately
2. Review activity logs
3. Consider deactivating affected users
