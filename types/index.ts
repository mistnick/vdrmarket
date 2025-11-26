// Type definitions for the application

import { User, Team, Document, Folder, Link, DataRoom } from "@prisma/client";

// Extended User type with relations
export type UserWithRelations = User & {
  teams?: TeamWithMembers[];
  documents?: Document[];
};

// Extended Team type with relations
export type TeamWithMembers = Team & {
  members?: TeamMemberWithUser[];
  documents?: Document[];
  folders?: Folder[];
  dataRooms?: DataRoom[];
};

// Team member with user details
export type TeamMemberWithUser = {
  id: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
};

// Document with relations
export type DocumentWithRelations = Document & {
  owner?: User;
  team?: Team;
  folder?: Folder;
  dataRoom?: DataRoom;
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
export type TeamRole = "owner" | "admin" | "member" | "viewer";
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
  | "team"
  | "user";
