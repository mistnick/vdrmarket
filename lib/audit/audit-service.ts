import { prisma as db } from "@/lib/db/prisma"
import { createHash } from "crypto"

export type AuditAction =
    | "created" | "updated" | "deleted" | "viewed" | "shared" | "downloaded"
    | "login" | "logout" | "password_change" | "security_settings"

export type AuditResourceType =
    | "document" | "folder" | "link" | "dataroom" | "user" | "system" | "permission" | "group"

export interface AuditEvent {
    action: AuditAction
    resourceType: AuditResourceType
    resourceId?: string
    dataRoomId?: string
    userId?: string
    metadata?: Record<string, any>
    ipAddress?: string
    userAgent?: string
}

export class AuditService {
    private static readonly SENSITIVE_KEYS = ['password', 'token', 'secret', 'credit_card', 'ssn']

    /**
     * Logs an event to the audit trail with immutability checks.
     */
    static async log(event: AuditEvent) {
        try {
            const maskedMetadata = this.maskSensitiveData(event.metadata)

            // Get the last log entry to chain the hash
            const lastLog = await db.auditLog.findFirst({
                orderBy: { createdAt: 'desc' }
            })

            const previousHash = lastLog?.hash || null

            // Create the log entry object (without hash first)
            const logEntryData = {
                action: event.action,
                resourceType: event.resourceType,
                resourceId: event.resourceId,
                dataRoomId: event.dataRoomId,
                userId: event.userId,
                metadata: maskedMetadata,
                ipAddress: event.ipAddress,
                userAgent: event.userAgent,
                previousHash,
                createdAt: new Date()
            }

            // Calculate hash
            const hash = this.calculateHash(logEntryData)

            // Save to DB
            await db.auditLog.create({
                data: {
                    ...logEntryData,
                    hash
                }
            })

        } catch (error) {
            console.error("Failed to create audit log:", error)
        }
    }

    /**
     * Calculates a SHA-256 hash of the log entry.
     */
    private static calculateHash(data: any): string {
        const content = JSON.stringify({
            action: data.action,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            userId: data.userId,
            metadata: data.metadata,
            previousHash: data.previousHash,
            timestamp: data.createdAt.toISOString()
        })

        return createHash('sha256').update(content).digest('hex')
    }

    /**
     * Recursively masks sensitive keys in the metadata object.
     */
    private static maskSensitiveData(data: any): any {
        if (!data) return null
        if (typeof data !== 'object') return data

        if (Array.isArray(data)) {
            return data.map(item => this.maskSensitiveData(item))
        }

        const masked: any = {}
        for (const key in data) {
            if (this.SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
                masked[key] = '***MASKED***'
            } else {
                masked[key] = this.maskSensitiveData(data[key])
            }
        }
        return masked
    }
}
