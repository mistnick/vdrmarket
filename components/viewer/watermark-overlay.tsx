"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";

interface WatermarkOverlayProps {
    userName: string;
    userEmail: string;
    visible?: boolean;
}

export function WatermarkOverlay({
    userName,
    userEmail,
    visible = true,
}: WatermarkOverlayProps) {
    const { t } = useI18n();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [ipAddress, setIpAddress] = useState("Loading...");

    useEffect(() => {
        // Update time every second
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // Fetch IP address
        fetch("/api/auth/ip")
            .then((res) => res.json())
            .then((data) => setIpAddress(data.ip || "Unknown"))
            .catch(() => setIpAddress("Unknown"));

        return () => clearInterval(interval);
    }, []);

    if (!visible) return null;

    const watermarkText = `${userName} | ${userEmail} | IP: ${ipAddress} | ${currentTime.toLocaleString()}`;

    return (
        <>
            {/* Diagonal watermark pattern */}
            <div
                className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none"
                style={{
                    background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 200px,
            rgba(0, 0, 0, 0.02) 200px,
            rgba(0, 0, 0, 0.02) 400px
          )`,
                }}
            >
                {/* Multiple watermark instances for coverage */}
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute whitespace-nowrap"
                        style={{
                            top: `${(i * 15) % 100}%`,
                            left: `${(i * 20) % 100}%`,
                            transform: "rotate(-45deg)",
                            opacity: 0.15,
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#000",
                            textShadow: "0 0 2px rgba(255,255,255,0.5)",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            MozUserSelect: "none",
                        }}
                    >
                        {watermarkText}
                    </div>
                ))}
            </div>

            {/* Centered watermark for visibility */}
            <div
                className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center select-none"
                style={{
                    transform: "rotate(-45deg)",
                    opacity: 0.08,
                    fontSize: "48px",
                    fontWeight: "bold",
                    color: "#000",
                    textShadow: "0 0 4px rgba(255,255,255,0.5)",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    MozUserSelect: "none",
                }}
            >
                {watermarkText}
            </div>
        </>
    );
}
