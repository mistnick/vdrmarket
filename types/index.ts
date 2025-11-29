// Type definitions for the application

import { User, Document, Folder, Link, DataRoom, Group, GroupMember } from "@prisma/client";

// Extended User type with relations
export type UserWithRelations = User & {
  groupMemberships?: GroupMemberWithGroup[];
  documents?: Document[];
};

// Extended DataRoom type with relations
export type DataRoomWithGroups = DataRoom & {
  groups?: GroupWithMembers[];
  documents?: Document[];
  folders?: Folder[];
  _count?: {
    documents: number;
    folders: number;
    groups: number;
  };
};

// Group with members
export type GroupWithMembers = Group & {
  members?: GroupMemberWithUser[];
};

// Group member with user details
export type GroupMemberWithUser = GroupMember & {
  user: User;
};

// Group member with group details
export type GroupMemberWithGroup = GroupMember & {
  group: Group;
};

// Document with relations
export type DocumentWithRelations = Document & {
  owner?: User;
  dataRoom?: DataRoom;
  folder?: Folder;
  links?: Link[];
  _count?: {
    views: number;
    links: number;
  };
};

// Link with relations
export type LinkWithRelations = Link & {
  document?: DocumentWithRelations;
  creator?: User;
  _count?: {
    views: number;
  };
};

// Folder with relations
export type FolderWithRelations = Folder & {
  parent?: Folder;
  children?: Folder[];
  documents?: Document[];
  dataRoom?: DataRoom;
};

// API Response types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Pagination
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

// Storage types
export type StorageProvider = "s3" | "azure";

export type FileUploadResult = {
  key: string;
  url: string;
  size: number;
  contentType?: string;
};

// Analytics types
export type ViewAnalytics = {
  totalViews: number;
  uniqueViewers: number;
  avgDuration: number;
  avgCompletionRate: number;
  viewsByDate: { date: string; count: number }[];
  viewersByCountry: { country: string; count: number }[];
};

export type DocumentAnalytics = ViewAnalytics & {
  totalDownloads: number;
  linkCount: number;
};

// Permission types
export type GroupRole = "owner" | "admin" | "member" | "viewer";
export type DataRoomPermission = "viewer" | "editor" | "admin";

// Audit log types
export type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "viewed"
  | "shared"
  | "downloaded"
  | "invited"
  | "removed";

export type AuditResourceType =
  | "document"
  | "folder"
  | "link"
  | "dataroom"
  | "group"
  | "user";
