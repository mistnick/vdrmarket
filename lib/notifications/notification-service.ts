import { prisma } from "@/lib/db/prisma";

export type NotificationType =
    | "link_viewed"
    | "document_shared"
    | "team_invitation"
    | "milestone_reached"
    | "document_downloaded"
    | "link_expired"
    | "new_team_member";

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, any>;
}

/**
 * Notification Service
 * Handles creation and management of user notifications
 */
export class NotificationService {
    /**
     * Create a notification for a user
     */
    static async create(params: CreateNotificationParams) {
        try {
            const notification = await prisma.notification.create({
                data: {
                    userId: params.userId,
                    type: params.type,
                    title: params.title,
                    message: params.message,
                    metadata: params.metadata || {},
                },
            });

            // Send real-time notification via WebSocket
            await this.sendRealtime(notification);

            return notification;
        } catch (error) {
            console.error("Error creating notification:", error);
            throw error;
        }
    }

    /**
     * Send real-time notification via WebSocket (if available)
     */
    private static async sendRealtime(notification: any) {
        try {
            // In production, this would connect to Socket.IO server
            // For now, we'll use a fetch to trigger the WebSocket via API
            if (typeof window === "undefined" && process.env.NEXTAUTH_URL) {
                // Server-side: Send to WebSocket room
                const io = (global as any).io;
                if (io) {
                    io.to(`user-${notification.userId}`).emit("notification", notification);
                }
            }
        } catch (error) {
            console.error("Error sending realtime notification:", error);
            // Don't throw - realtime is optional
        }
    }

    /**
     * Create a "link viewed" notification
     */
    static async notifyLinkViewed(params: {
        ownerId: string;
        linkName: string;
        viewerEmail?: string;
        documentName: string;
    }) {
        return this.create({
            userId: params.ownerId,
            type: "link_viewed",
            title: "New Link View",
            message: `Your link "${params.linkName}" for document "${params.documentName}" was viewed${params.viewerEmail ? ` by ${params.viewerEmail}` : ""
                }`,
            metadata: {
                linkName: params.linkName,
                documentName: params.documentName,
                viewerEmail: params.viewerEmail,
            },
        });
    }

    /**
     * Create a "milestone reached" notification
     */
    static async notifyMilestoneReached(params: {
        ownerId: string;
        milestone: number;
        documentName: string;
        linkName?: string;
    }) {
        return this.create({
            userId: params.ownerId,
            type: "milestone_reached",
            title: `🎉 ${params.milestone} Views Reached!`,
            message: `Your document "${params.documentName}" has reached ${params.milestone} views!`,
            metadata: {
                milestone: params.milestone,
                documentName: params.documentName,
                linkName: params.linkName,
            },
        });
    }

    /**
     * Create a "document downloaded" notification
     */
    static async notifyDocumentDownloaded(params: {
        ownerId: string;
        documentName: string;
        viewerEmail?: string;
        linkName?: string;
    }) {
        return this.create({
            userId: params.ownerId,
            type: "document_downloaded",
            title: "Document Downloaded",
            message: `Your document "${params.documentName}" was downloaded${params.viewerEmail ? ` by ${params.viewerEmail}` : ""
                }`,
            metadata: {
                documentName: params.documentName,
                viewerEmail: params.viewerEmail,
                linkName: params.linkName,
            },
        });
    }

    /**
     * Create a "team invitation" notification
     */
    static async notifyTeamInvitation(params: {
        userId: string;
        teamName: string;
        inviterName?: string;
    }) {
        return this.create({
            userId: params.userId,
            type: "team_invitation",
            title: "Team Invitation",
            message: `${params.inviterName || "Someone"
                } invited you to join "${params.teamName}"`,
            metadata: {
                teamName: params.teamName,
                inviterName: params.inviterName,
            },
        });
    }

    /**
     * Create a "link expired" notification
     */
    static async notifyLinkExpired(params: {
        ownerId: string;
        linkName: string;
        documentName: string;
    }) {
        return this.create({
            userId: params.ownerId,
            type: "link_expired",
            title: "Link Expired",
            message: `Your link "${params.linkName}" for "${params.documentName}" has expired`,
            metadata: {
                linkName: params.linkName,
                documentName: params.documentName,
            },
        });
    }

    /**
     * Delete old read notifications (cleanup)
     */
    static async cleanupOldNotifications(daysOld: number = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await prisma.notification.deleteMany({
            where: {
                read: true,
                createdAt: {
                    lt: cutoffDate,
                },
            },
        });

        return result.count;
    }

    /**
     * Get unread count for a user
     */
    static async getUnreadCount(userId: string): Promise<number> {
        return prisma.notification.count({
            where: {
                userId,
                read: false,
            },
        });
    }
}
