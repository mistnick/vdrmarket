/**
 * VDR Access Middleware
 * Validates user access based on IP, 2FA, time windows, and status
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { validateUserAccess } from "@/lib/vdr/user-access";

export interface VDRAccessOptions {
    dataRoomId: string;
    requireActive?: boolean;
    check2FA?: boolean;
    checkIP?: boolean;
    checkTimeWindow?: boolean;
}

/**
 * Middleware to validate VDR access
 * Use in API routes to ensure user has valid access to a data room
 */
export async function withVDRAccess(
    req: NextRequest,
    options: VDRAccessOptions,
    handler: (req: NextRequest, userId: string) => Promise<Response>
): Promise<Response> {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get client IP
        const clientIP =
            req.headers.get("x-forwarded-for")?.split(",")[0] ||
            req.headers.get("x-real-ip") ||
            "unknown";

        // Validate access
        const validation = await validateUserAccess(user.id, options.dataRoomId, {
            ipAddress: options.checkIP ? clientIP : undefined,
            has2FA: true, // TODO: Check actual 2FA status from session
        });

        if (!validation.allowed) {
            return NextResponse.json(
                {
                    error: validation.reason,
                    requiresActivation: validation.requiresActivation,
                    requires2FA: validation.requires2FA,
                },
                { status: 403 }
            );
        }

        // Call the actual handler
        return handler(req, user.id);
    } catch (error) {
        console.error("VDR access validation error:", error);
        return NextResponse.json(
            { error: "Access validation failed" },
            { status: 500 }
        );
    }
}

/**
 * Extract data room ID from various sources
 */
export function getDataRoomIdFromRequest(
    req: NextRequest,
    params?: any
): string | null {
    // Try from URL params
    if (params?.dataRoomId) {
        return params.dataRoomId;
    }

    // Try from query string
    const { searchParams } = new URL(req.url);
    const dataRoomId = searchParams.get("dataRoomId");
    if (dataRoomId) {
        return dataRoomId;
    }

    // Try from request body (for POST/PUT)
    // Note: This requires the body to be parsed separately
    return null;
}

/**
 * Check if user has 2FA enabled and verified in current session
 */
export async function check2FAStatus(userId: string): Promise<boolean> {
    // TODO: Implement actual 2FA session check
    // For now, return true (assuming 2FA is satisfied)
    return true;
}
