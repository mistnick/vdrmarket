import { prisma as db } from "@/lib/db/prisma"
import { AuditEvent } from "./audit-service"

export class MonitoringService {

    /**
     * Checks an event for suspicious patterns and triggers alerts.
     */
    static async check(event: AuditEvent) {
        if (event.action === 'login') {
            await this.checkSuspiciousLogin(event)
        }

        if (event.action === 'downloaded') {
            await this.checkMassiveDownloads(event)
        }
    }

    private static async checkSuspiciousLogin(event: AuditEvent) {
        if (!event.userId) return

        // Check for multiple failed logins in the last 15 minutes
        // Note: This requires us to log failed logins specifically. 
        // Assuming 'login' action includes status in metadata or we have a 'login_failed' action.
        // For this implementation, let's assume we look for 'login' with metadata { success: false }

        if (event.metadata?.success === false) {
            const recentFailures = await db.auditLog.count({
                where: {
                    userId: event.userId,
                    action: 'login',
                    createdAt: {
                        gte: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
                    },
                    metadata: {
                        path: ['success'],
                        equals: false
                    }
                }
            })

            if (recentFailures >= 5) {
                await this.sendAlert(event.userId, "Multiple failed login attempts detected", `User ${event.userId} has failed to login 5+ times in the last 15 minutes.`)
            }
        }

        // Check for new IP/Location (simplified: just check if IP was used before)
        if (event.ipAddress && event.metadata?.success === true) {
            const previousLoginFromIp = await db.auditLog.findFirst({
                where: {
                    userId: event.userId,
                    action: 'login',
                    ipAddress: event.ipAddress,
                    id: { not: undefined } // just to ensure we don't match the current one if it was already saved (though check is usually called after)
                }
            })

            // If this is a strictly new IP for the user
            // (This might be noisy, usually we check GeoIP, but for now IP match is a proxy)
            // We need to be careful not to alert on the very first login ever.
            const anyLogin = await db.auditLog.findFirst({
                where: { userId: event.userId, action: 'login' }
            })

            if (anyLogin && !previousLoginFromIp) {
                // This is a new IP for an existing user
                await this.sendAlert(event.userId, "Login from new IP address", `User logged in from new IP: ${event.ipAddress}`)
            }
        }
    }

    private static async checkMassiveDownloads(event: AuditEvent) {
        if (!event.userId) return

        // Count downloads in last 5 minutes
        const recentDownloads = await db.auditLog.count({
            where: {
                userId: event.userId,
                action: 'downloaded',
                createdAt: {
                    gte: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes
                }
            }
        })

        if (recentDownloads > 20) {
            await this.sendAlert(event.userId, "High download volume detected", `User ${event.userId} has downloaded ${recentDownloads} documents in the last 5 minutes.`)
        }
    }

    private static async sendAlert(userId: string, title: string, message: string) {
        console.warn(`[SECURITY ALERT] ${title}: ${message}`)
        // In a real app, we would integrate with the Notification system or Email service here.
        // For now, we log it.

        // Example integration if we had the notification service ready:
        // await createNotification({ userId, title, message, type: 'security_alert' })
    }
}
