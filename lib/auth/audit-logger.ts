import { prisma } from "@/lib/db/prisma";
import { getClientIP } from "./session-metadata";
import { NextRequest } from "next/server";

export type AuditAction =
    | "LOGIN"
    | "LOGOUT"
    | "LOGIN_FAILED"
    | "DOCUMENT_CREATED"
    | "DOCUMENT_UPDATED"
    | "DOCUMENT_DELETED"
    | "DOCUMENT_VIEWED"
    | "DOCUMENT_DOWNLOADED"
    | "DOCUMENT_PRINTED"
    | "DOCUMENT_WATERMARKED"
    | "FOLDER_CREATED"
    | "FOLDER_UPDATED"
    | "FOLDER_DELETED"
    | "LINK_CREATED"
    | "LINK_UPDATED"
    | "LINK_DELETED"
    | "LINK_ACCESSED"
    | "DATAROOM_CREATED"
    | "DATAROOM_UPDATED"
    | "DATAROOM_DELETED"
    | "PERMISSION_CHANGED"
    | "USER_INVITED"
    | "USER_REMOVED"
    | "TEAM_CREATED"
    | "TEAM_UPDATED"
    | "TEAM_DELETED"
    | "SECURITY_VIOLATION";

export type ResourceType =
    | "document"
    | "folder"
    | "link"
    | "dataroom"
    | "team"
    | "user"
    | "permission";

interface CreateAuditLogParams {
    teamId?: string;
    userId?: string;
    action: AuditAction;
    resourceType: ResourceType;
    resourceId: string;
    metadata?: Record<string, any>;
    request?: NextRequest;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog({
    teamId,
    userId,
    action,
    resourceType,
    resourceId,
    metadata,
    request,
    ipAddress: providedIpAddress,
    userAgent: providedUserAgent,
}: CreateAuditLogParams) {
    try {
        let ipAddress = providedIpAddress;
        let userAgent = providedUserAgent;

        // Extract IP and user agent from request if provided
        if (request) {
            ipAddress = ipAddress || (await getClientIP(request));
            userAgent = userAgent || request.headers.get("user-agent") || undefined;
        }

        await prisma.auditLog.create({
            data: {
                teamId,
                userId,
                action,
                resourceType,
                resourceId,
                metadata: metadata || {},
                ipAddress,
                userAgent,
            },
        });
    } catch (error) {
        // Log error but don't throw - audit logging should never break the application
        console.error("Failed to create audit log:", error);
    }
}

/**
 * Helper to log document actions
 */
export async function logDocumentAction(
    action: Extract<
        AuditAction,
        | "DOCUMENT_CREATED"
        | "DOCUMENT_UPDATED"
        | "DOCUMENT_DELETED"
        | "DOCUMENT_VIEWED"
        | "DOCUMENT_DOWNLOADED"
        | "DOCUMENT_PRINTED"
    >,
    documentId: string,
    userId?: string,
    teamId?: string,
    metadata?: Record<string, any>,
    request?: NextRequest
) {
    return createAuditLog({
        action,
        resourceType: "document",
        resourceId: documentId,
        userId,
        teamId,
        metadata,
        request,
    });
}

/**
 * Helper to log permission changes
 */
export async function logPermissionChange(
    resourceType: ResourceType,
    resourceId: string,
    userId: string,
    teamId: string,
    metadata: {
        previousPermissions?: any;
        newPermissions?: any;
        targetUserId?: string;
        [key: string]: any;
    },
    request?: NextRequest
) {
    return createAuditLog({
        action: "PERMISSION_CHANGED",
        resourceType,
        resourceId,
        userId,
        teamId,
        metadata,
        request,
    });
}

/**
 * Helper to log authentication events
 */
export async function logAuthEvent(
    action: Extract<AuditAction, "LOGIN" | "LOGOUT" | "LOGIN_FAILED">,
    userId: string,
    metadata?: Record<string, any>,
    request?: NextRequest
) {
    return createAuditLog({
        action,
        resourceType: "user",
        resourceId: userId,
        userId,
        metadata,
        request,
    });
}
