-- VDR System Migration
-- Add comprehensive VDR models and fields

-- ============================================
-- Step 1: Create GroupType enum
-- ============================================
CREATE TYPE "GroupType" AS ENUM ('ADMINISTRATOR', 'USER', 'CUSTOM');

-- ============================================
-- Step 2: Extend User table with VDR fields
-- ============================================
ALTER TABLE "users" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "users" ADD COLUMN "accessType" TEXT NOT NULL DEFAULT 'UNLIMITED';
ALTER TABLE "users" ADD COLUMN "accessStartAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "accessEndAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "allowedIps" JSONB;

CREATE INDEX "users_status_idx" ON "users"("status");

-- ============================================
-- Step 3: Extend DataRoom table
-- ============================================
ALTER TABLE "data_rooms" ADD COLUMN "qnaEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "data_rooms" ADD COLUMN "dueDiligenceChecklistEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "data_rooms" ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "data_rooms_archivedAt_idx" ON "data_rooms"("archivedAt");

-- ============================================
-- Step 4: Extend Document table for soft delete
-- ============================================
ALTER TABLE "documents" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "documents" ADD COLUMN "deletedById" TEXT;

CREATE INDEX "documents_deletedAt_idx" ON "documents"("deletedAt");

-- ============================================
-- Step 5: Extend Folder table for soft delete
-- ============================================
ALTER TABLE "folders" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "folders" ADD COLUMN "deletedById" TEXT;

CREATE INDEX "folders_deletedAt_idx" ON "folders"("deletedAt");

-- ============================================
-- Step 6: Create Groups table
-- ============================================
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "dataRoomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "GroupType" NOT NULL DEFAULT 'USER',
    "canViewDueDiligenceChecklist" BOOLEAN NOT NULL DEFAULT false,
    "canManageDocumentPermissions" BOOLEAN NOT NULL DEFAULT false,
    "canViewGroupUsers" BOOLEAN NOT NULL DEFAULT false,
    "canManageUsers" BOOLEAN NOT NULL DEFAULT false,
    "canViewGroupActivity" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "groups_dataRoomId_idx" ON "groups"("dataRoomId");
CREATE INDEX "groups_type_idx" ON "groups"("type");

ALTER TABLE "groups" ADD CONSTRAINT "groups_dataRoomId_fkey" FOREIGN KEY ("dataRoomId") REFERENCES "data_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- Step 7: Create GroupMembers table
-- ============================================
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "group_members"("groupId", "userId");
CREATE INDEX "group_members_groupId_idx" ON "group_members"("groupId");
CREATE INDEX "group_members_userId_idx" ON "group_members"("userId");

ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- Step 8: Create UserInvitations table
-- ============================================
CREATE TABLE "user_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dataRoomId" TEXT NOT NULL,
    "groupIds" JSONB NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_invitations_token_key" ON "user_invitations"("token");
CREATE INDEX "user_invitations_token_idx" ON "user_invitations"("token");
CREATE INDEX "user_invitations_email_idx" ON "user_invitations"("email");
CREATE INDEX "user_invitations_dataRoomId_idx" ON "user_invitations"("dataRoomId");

ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_dataRoomId_fkey" FOREIGN KEY ("dataRoomId") REFERENCES "data_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- Step 9: Create Document Group Permissions table
-- ============================================
CREATE TABLE "document_group_permissions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "canFence" BOOLEAN NOT NULL DEFAULT false,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canDownloadEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "canDownloadPdf" BOOLEAN NOT NULL DEFAULT false,
    "canDownloadOriginal" BOOLEAN NOT NULL DEFAULT false,
    "canUpload" BOOLEAN NOT NULL DEFAULT false,
    "canManage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_group_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_group_permissions_documentId_groupId_key" ON "document_group_permissions"("documentId", "groupId");
CREATE INDEX "document_group_permissions_documentId_idx" ON "document_group_permissions"("documentId");
CREATE INDEX "document_group_permissions_groupId_idx" ON "document_group_permissions"("groupId");

ALTER TABLE "document_group_permissions" ADD CONSTRAINT "document_group_permissions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_group_permissions" ADD CONSTRAINT "document_group_permissions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- Step 10: Create Document User Permissions table
-- ============================================
CREATE TABLE "document_user_permissions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "canFence" BOOLEAN NOT NULL DEFAULT false,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canDownloadEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "canDownloadPdf" BOOLEAN NOT NULL DEFAULT false,
    "canDownloadOriginal" BOOLEAN NOT NULL DEFAULT false,
    "canUpload" BOOLEAN NOT NULL DEFAULT false,
    "canManage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_user_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_user_permissions_documentId_userId_key" ON "document_user_permissions"("documentId", "userId");
CREATE INDEX "document_user_permissions_documentId_idx" ON "document_user_permissions"("documentId");
CREATE INDEX "document_user_permissions_userId_idx" ON "document_user_permissions"("userId");

ALTER TABLE "document_user_permissions" ADD CONSTRAINT "document_user_permissions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_user_permissions" ADD CONSTRAINT "document_user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- Step 11: Create Folder Group Permissions table
-- ============================================
CREATE TABLE "folder_group_permissions" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "canFence" BOOLEAN NOT NULL DEFAULT false,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canDownloadEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "canDownloadPdf" BOOLEAN NOT NULL DEFAULT false,
    "canDownloadOriginal" BOOLEAN NOT NULL DEFAULT false,
    "canUpload" BOOLEAN NOT NULL DEFAULT false,
    "canManage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folder_group_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "folder_group_permissions_folderId_groupId_key" ON "folder_group_permissions"("folderId", "groupId");
CREATE INDEX "folder_group_permissions_folderId_idx" ON "folder_group_permissions"("folderId");
CREATE INDEX "folder_group_permissions_groupId_idx" ON "folder_group_permissions"("groupId");

ALTER TABLE "folder_group_permissions" ADD CONSTRAINT "folder_group_permissions_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "folder_group_permissions" ADD CONSTRAINT "folder_group_permissions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- Step 12: Create Folder User Permissions table
-- ============================================
CREATE TABLE "folder_user_permissions" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "canFence" BOOLEAN NOT NULL DEFAULT false,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canDownloadEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "canDownloadPdf" BOOLEAN NOT NULL DEFAULT false,
    "canDownloadOriginal" BOOLEAN NOT NULL DEFAULT false,
    "canUpload" BOOLEAN NOT NULL DEFAULT false,
    "canManage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folder_user_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "folder_user_permissions_folderId_userId_key" ON "folder_user_permissions"("folderId", "userId");
CREATE INDEX "folder_user_permissions_folderId_idx" ON "folder_user_permissions"("folderId");
CREATE INDEX "folder_user_permissions_userId_idx" ON "folder_user_permissions"("userId");

ALTER TABLE "folder_user_permissions" ADD CONSTRAINT "folder_user_permissions_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "folder_user_permissions" ADD CONSTRAINT "folder_user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- Step 13: Create Due Diligence Checklists table  
-- ============================================
CREATE TABLE "due_diligence_checklists" (
    "id" TEXT NOT NULL,
    "dataRoomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "due_diligence_checklists_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "due_diligence_checklists_dataRoomId_idx" ON "due_diligence_checklists"("dataRoomId");

ALTER TABLE "due_diligence_checklists" ADD CONSTRAINT "due_diligence_checklists_dataRoomId_fkey" FOREIGN KEY ("dataRoomId") REFERENCES "data_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- Step 14: Create Due Diligence Items table
-- ============================================
CREATE TABLE "due_diligence_items" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "due_diligence_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "due_diligence_items_checklistId_idx" ON "due_diligence_items"("checklistId");

ALTER TABLE "due_diligence_items" ADD CONSTRAINT "due_diligence_items_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "due_diligence_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
