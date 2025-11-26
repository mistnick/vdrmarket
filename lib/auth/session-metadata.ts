import { NextRequest } from "next/server";
import { headers } from "next/headers";

export interface SessionMetadata {
    ipAddress: string;
    userAgent: string;
    device: string;
    browser: string;
    os: string;
    location?: string;
}

/**
 * Extract IP address from request, handling proxies and load balancers
 */
export async function getClientIP(request: NextRequest | null = null): Promise<string> {
    if (request) {
        // Check various headers for real IP (prioritized order)
        const forwardedFor = request.headers.get("x-forwarded-for");
        if (forwardedFor) {
            return forwardedFor.split(",")[0].trim();
        }

        const realIP = request.headers.get("x-real-ip");
        if (realIP) {
            return realIP;
        }

        const cfConnectingIP = request.headers.get("cf-connecting-ip"); // Cloudflare
        if (cfConnectingIP) {
            return cfConnectingIP;
        }
    }

    // Fallback to headers() in server components (Next.js 15: headers() is async)
    try {
        const headersList = await headers();
        const forwardedFor = headersList.get("x-forwarded-for");
        if (forwardedFor) {
            return forwardedFor.split(",")[0].trim();
        }

        const realIP = headersList.get("x-real-ip");
        if (realIP) {
            return realIP;
        }
    } catch {
        // headers() not available in this context
    }

    return "unknown";
}

/**
 * Parse user agent string to extract device type
 */
export function getDeviceType(userAgent: string): string {
    const ua = userAgent.toLowerCase();

    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
        return "Mobile";
    }
    if (ua.includes("tablet") || ua.includes("ipad")) {
        return "Tablet";
    }
    return "Desktop";
}

/**
 * Parse user agent string to extract browser name
 */
export function getBrowserName(userAgent: string): string {
    const ua = userAgent.toLowerCase();

    if (ua.includes("edg/")) return "Edge";
    if (ua.includes("chrome")) return "Chrome";
    if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
    if (ua.includes("firefox")) return "Firefox";
    if (ua.includes("opera") || ua.includes("opr")) return "Opera";
    if (ua.includes("brave")) return "Brave";

    return "Unknown";
}

/**
 * Parse user agent string to extract OS name
 */
export function getOSName(userAgent: string): string {
    const ua = userAgent.toLowerCase();

    if (ua.includes("win")) return "Windows";
    if (ua.includes("mac")) return "macOS";
    if (ua.includes("linux")) return "Linux";
    if (ua.includes("android")) return "Android";
    if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) return "iOS";

    return "Unknown";
}

/**
 * Get approximate location from IP address (requires external service)
 * For now, returns null. Can be integrated with ipapi.co, ipgeolocation.io, etc.
 */
export async function getLocationFromIP(ip: string): Promise<string | null> {
    // TODO: Integrate with IP geolocation service
    // Example: https://ipapi.co/${ip}/json/

    // For development, return null
    if (ip === "unknown" || ip === "127.0.0.1" || ip === "::1") {
        return "Local";
    }

    return null;
}

/**
 * Extract complete session metadata from request
 */
export async function getSessionMetadata(
    request: NextRequest | null = null
): Promise<SessionMetadata> {
    let userAgent = "Unknown";
    let ip: string;

    if (request) {
        userAgent = request.headers.get("user-agent") || "Unknown";
        ip = await getClientIP(request);
    } else {
        try {
            const headersList = await headers();
            userAgent = headersList.get("user-agent") || "Unknown";
            ip = await getClientIP(null);
        } catch {
            // headers() not available
            ip = "unknown";
        }
    }

    const location = await getLocationFromIP(ip);

    return {
        ipAddress: ip,
        userAgent,
        device: getDeviceType(userAgent),
        browser: getBrowserName(userAgent),
        os: getOSName(userAgent),
        location: location || undefined,
    };
}
