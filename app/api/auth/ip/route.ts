import { NextRequest, NextResponse } from "next/server";
import { getClientIP } from "@/lib/auth/session-metadata";

export async function GET(request: NextRequest) {
    try {
        const ip = await getClientIP(request);

        return NextResponse.json({ ip });
    } catch (error) {
        console.error("Error getting IP:", error);
        return NextResponse.json({ ip: "Unknown" }, { status: 200 });
    }
}
