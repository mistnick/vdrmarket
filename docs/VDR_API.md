# VDR (Virtual Data Room) System - API Documentation

## Overview

The VDR system provides comprehensive access control, permission management, and user administration for Virtual Data Rooms.

## Base URL

```
/api/vdr
```

## Authentication

All endpoints require authentication via NextAuth session. Include authentication credentials in cookies.

## Group Management

### List Groups

```http
GET /api/vdr/[dataRoomId]/groups
```

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "type": "ADMINISTRATOR" | "USER" | "CUSTOM",
    "description": "string",
    "_count": {
      "members": number
    }
  }
]
```

### Create Group

```http
POST /api/vdr/[dataRoomId]/groups
```

**Body:**
```json
{
  "name": "string",
  "type": "ADMINISTRATOR" | "USER" | "CUSTOM",
  "description": "string (optional)",
  "canViewDueDiligenceChecklist": boolean,
  "canManageDocumentPermissions": boolean,
  "canViewGroupUsers": boolean,
  "canManageUsers": boolean,
  "canViewGroupActivity": boolean
}
```

**Permissions:** Administrator only

### Update Group

```http
PATCH /api/vdr/[dataRoomId]/groups/[groupId]
```

**Body:** Same as create (partial update supported)

**Permissions:** Administrator only

### Delete Group

```http
DELETE /api/vdr/[dataRoomId]/groups/[groupId]
```

**Permissions:** Administrator only (cannot delete ADMINISTRATOR groups)

## User Management

### Invite User

```http
POST /api/vdr/[dataRoomId]/users/invite
```

**Body:**
```json
{
  "email": "string",
  "groupIds": ["string"],
  "accessType": "UNLIMITED" | "LIMITED",
  "accessStartAt": "ISO 8601 date (optional)",
  "accessEndAt": "ISO 8601 date (optional)",
  "require2FA": boolean,
  "allowedIps": ["string"] (optional)
}
```

**Response:**
```json
{
  "message": "string",
  "invitationId": "string",
  "userId": "string"
}
```

**Permissions:** Administrator or users with `canCreateGroupsInviteUsers`

### Activate User Account

```http
POST /api/vdr/users/activate
```

**Body:**
```json
{
  "token": "string",
  "password": "string",
  "name": "string (optional)"
}
```

**Public endpoint** (no authentication required)

### Get User

```http
GET /api/vdr/[dataRoomId]/users/[userId]
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "status": "ACTIVE" | "PENDING_INVITE" | "DEACTIVATED" | "EXPIRED",
  "accessType": "UNLIMITED" | "LIMITED",
  "accessStartAt": "ISO 8601 date",
  "accessEndAt": "ISO 8601 date",
  "twoFactorEnabled": boolean,
  "groupMemberships": [...]
}
```

### Update User

```http
PATCH /api/vdr/[dataRoomId]/users/[userId]
```

**Body:**
```json
{
  "status": "string",
  "accessType": "string",
  "accessStartAt": "ISO 8601 date",
  "accessEndAt": "ISO 8601 date",
  "allowedIps": ["string"],
  "require2FA": boolean
}
```

**Permissions:** Administrator or group managers

### Deactivate User

```http
DELETE /api/vdr/[dataRoomId]/users/[userId]
```

**Permissions:** Administrator only

## Document & Folder Permissions

### Get Document Permissions

```http
GET /api/vdr/documents/[documentId]/permissions
```

**Response:**
```json
{
  "groupPermissions": [...],
  "userPermissions": [...],
  "effectivePermissions": {
    "canFence": boolean,
    "canView": boolean,
    "canDownloadEncrypted": boolean,
    "canDownloadPdf": boolean,
    "canDownloadOriginal": boolean,
    "canUpload": boolean,
    "canManage": boolean
  }
}
```

### Set Document Permissions

```http
POST /api/vdr/documents/[documentId]/permissions
```

**Body:**
```json
{
  "type": "group" | "user",
  "targetId": "string",
  "permissions": {
    "canFence": boolean,
    "canView": boolean,
    "canDownloadEncrypted": boolean,
    "canDownloadPdf": boolean,
    "canDownloadOriginal": boolean,
    "canUpload": boolean,
    "canManage": boolean
  }
}
```

**Permissions:** Users with `canManageDocumentPermissions`

### Remove Document Permissions

```http
DELETE /api/vdr/documents/[documentId]/permissions?type=group&targetId=xxx
```

**Permissions:** Users with `canManageDocumentPermissions`

### Folder Permissions

Same endpoints structure for folders:
- `GET /api/vdr/folders/[folderId]/permissions`
- `POST /api/vdr/folders/[folderId]/permissions`

## Recycle Bin

### List Deleted Items

```http
GET /api/vdr/[dataRoomId]/recycle-bin
```

**Response:**
```json
{
  "documents": [...],
  "folders": [...]
}
```

**Permissions:** Administrator only

### Restore Item

```http
POST /api/vdr/[dataRoomId]/recycle-bin/restore
```

**Body:**
```json
{
  "type": "document" | "folder",
  "itemId": "string"
}
```

**Permissions:** Administrator only

### Permanently Delete

```http
DELETE /api/vdr/[dataRoomId]/recycle-bin/[itemId]?type=document
```

**Permissions:** Administrator only

## Activity & Reports

### Get Activity Logs

```http
GET /api/vdr/[dataRoomId]/activity?scope=self&startDate=xxx&endDate=xxx
```

**Query Parameters:**
- `scope`: "self" | "group" | "all"
- `startDate`: ISO 8601 date (optional)
- `endDate`: ISO 8601 date (optional)
- `action`: string (optional)
- `resourceType`: string (optional)

**Response:**
```json
{
  "activities": [...],
  "scope": "string",
  "filters": {...}
}
```

**Permissions:**
- "self": All users
- "group": Users with `canViewGroupActivity`
- "all": Administrator only

## Due Diligence

### Get Checklists

```http
GET /api/vdr/[dataRoomId]/due-diligence
```

**Permissions:** Users with `canViewDueDiligenceChecklist`

### Create Checklist

```http
POST /api/vdr/[dataRoomId]/due-diligence
```

**Body:**
```json
{
  "name": "string",
  "description": "string",
  "items": [
    {
      "title": "string",
      "description": "string",
      "order": number
    }
  ]
}
```

**Permissions:** Administrator only

### Update Checklist Item

```http
PATCH /api/vdr/due-diligence/items/[itemId]
```

**Body:**
```json
{
  "completed": boolean
}
```

**Permissions:** Users with `canViewDueDiligenceChecklist`

## Data Room Settings

### Get Settings

```http
GET /api/vdr/[dataRoomId]/settings
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "qnaEnabled": boolean,
  "dueDiligenceChecklistEnabled": boolean,
  "archivedAt": "ISO 8601 date"
}
```

### Update Settings

```http
PATCH /api/vdr/[dataRoomId]/settings
```

**Body:**
```json
{
  "qnaEnabled": boolean,
  "dueDiligenceChecklistEnabled": boolean
}
```

**Permissions:** Administrator only

### Archive Data Room

```http
POST /api/vdr/[dataRoomId]/settings/archive
```

**Permissions:** Administrator only

## Permission Matrix

### ADMINISTRATOR Group
- Full access to all features
- Can manage project settings
- Access recycle bin
- Manage Q&A
- View all documents
- Use AI search
- Create groups and invite users
- Manage all users

### USER Group
- Document access (based on permissions)
- Optional: View due diligence checklist
- Optional: View group users
- Optional: View group activity

### CUSTOM Group
- Configurable permissions:
  - View due diligence checklist
  - Manage document permissions
  - Manage users (within group)
  - View group users
  - View group activity

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message"
}
```

**Common Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

No rate limiting currently implemented. Consider implementing for production.

## Best Practices

1. **Always check permissions** before making admin-only requests
2. **Validate input** on the client side before sending
3. **Handle errors gracefully** and show user-friendly messages
4. **Use proper HTTP methods** (GET for reads, POST for creates, PATCH for updates, DELETE for deletes)
5. **Cache** group and permission data when appropriate
