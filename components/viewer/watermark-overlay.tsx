"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";

export interface WatermarkOverlayProps {
    /** User display name */
    userName: string;
    /** User email address */
    userEmail: string;
    /** IP address (if pre-fetched) */
    ipAddress?: string;
    /** Whether watermark is visible */
    visible?: boolean;
    /** Custom watermark text (overrides default) */
    customText?: string;
    /** Opacity level (0-1) */
    opacity?: number;
    /** Font size in pixels */
    fontSize?: number;
    /** Animated watermark for better screenshot protection */
    animated?: boolean;
    /** Anti-manipulation mode - adds extra protections */
    antiManipulation?: boolean;
}

/**
 * Enhanced watermark overlay component with dynamic content and anti-manipulation features
 * Features:
 * - Dynamic IP address display
 * - Real-time timestamp updates
 * - Animated watermarks for screenshot protection
 * - Anti-DOM manipulation detection
 * - Multiple coverage patterns
 */
export function WatermarkOverlay({
    userName,
    userEmail,
    ipAddress: initialIpAddress,
    visible = true,
    customText,
    opacity = 0.12,
    fontSize = 14,
    animated = true,
    antiManipulation = true,
}: WatermarkOverlayProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [ipAddress, setIpAddress] = useState(initialIpAddress || "Loading...");
    const [animationOffset, setAnimationOffset] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const mutationObserverRef = useRef<MutationObserver | null>(null);

    // Fetch IP address if not provided
    useEffect(() => {
        if (!initialIpAddress) {
            fetch("/api/auth/ip")
                .then((res) => res.json())
                .then((data) => setIpAddress(data.ip || "Unknown"))
                .catch(() => setIpAddress("Unknown"));
        }
    }, [initialIpAddress]);

    // Update time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Animation for screenshot protection
    useEffect(() => {
        if (!animated) return;

        let frameId: number;
        let lastTime = 0;
        const animationSpeed = 0.02; // Very slow movement

        const animate = (timestamp: number) => {
            if (timestamp - lastTime > 100) { // Update every 100ms
                setAnimationOffset((prev) => (prev + animationSpeed) % 100);
                lastTime = timestamp;
            }
            frameId = requestAnimationFrame(animate);
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [animated]);

    // Anti-manipulation: Detect DOM changes
    useEffect(() => {
        if (!antiManipulation || !containerRef.current) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // If watermark is removed or hidden, recreate it
                if (mutation.type === "childList" || mutation.type === "attributes") {
                    const container = containerRef.current;
                    if (container) {
                        // Check if display/visibility was changed
                        const style = window.getComputedStyle(container);
                        if (
                            style.display === "none" ||
                            style.visibility === "hidden" ||
                            style.opacity === "0"
                        ) {
                            // Force visibility back
                            container.style.display = "block";
                            container.style.visibility = "visible";
                            container.style.opacity = "1";
                        }
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["style", "class"],
        });

        mutationObserverRef.current = observer;

        return () => {
            observer.disconnect();
        };
    }, [antiManipulation]);

    // Generate watermark text
    const watermarkText = useMemo(() => {
        if (customText) return customText;
        const timeStr = currentTime.toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });
        return `${userName} • ${userEmail} • IP: ${ipAddress} • ${timeStr}`;
    }, [customText, userName, userEmail, ipAddress, currentTime]);

    // Generate watermark positions with animation offset
    const watermarkPositions = useMemo(() => {
        const positions = [];
        const rows = 8;
        const cols = 4;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const baseTop = (row / rows) * 100;
                const baseLeft = (col / cols) * 100 + (row % 2 === 0 ? 12.5 : 0);
                positions.push({
                    id: `${row}-${col}`,
                    top: animated
                        ? (baseTop + animationOffset) % 120 - 10
                        : baseTop,
                    left: baseLeft,
                });
            }
        }
        return positions;
    }, [animated, animationOffset]);

    if (!visible) return null;

    return (
        <div
            ref={containerRef}
            className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
            style={{
                // Anti-manipulation: make it harder to hide via CSS
                display: "block !important" as any,
                visibility: "visible !important" as any,
            }}
            data-watermark="true"
            aria-hidden="true"
        >
            {/* Subtle background pattern */}
            <div
                className="absolute inset-0"
                style={{
                    background: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 300px,
                        rgba(0, 0, 0, 0.01) 300px,
                        rgba(0, 0, 0, 0.01) 600px
                    )`,
                }}
            />

            {/* Multiple watermark instances for full coverage */}
            {watermarkPositions.map((pos) => (
                <div
                    key={pos.id}
                    className="absolute whitespace-nowrap select-none"
                    style={{
                        top: `${pos.top}%`,
                        left: `${pos.left}%`,
                        transform: "rotate(-35deg) translateX(-50%)",
                        opacity: opacity,
                        fontSize: `${fontSize}px`,
                        fontWeight: 600,
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        color: "#000",
                        textShadow: "0 0 2px rgba(255,255,255,0.8)",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        MozUserSelect: "none",
                        letterSpacing: "0.5px",
                        pointerEvents: "none",
                    }}
                >
                    {watermarkText}
                </div>
            ))}

            {/* Large centered watermark */}
            <div
                className="absolute inset-0 flex items-center justify-center select-none"
                style={{
                    transform: "rotate(-35deg)",
                    opacity: opacity * 0.6,
                    fontSize: `${fontSize * 2.5}px`,
                    fontWeight: "bold",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    color: "#000",
                    textShadow: "0 0 4px rgba(255,255,255,0.9)",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    MozUserSelect: "none",
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                }}
            >
                {watermarkText}
            </div>

            {/* Edge watermarks for better coverage */}
            <div
                className="absolute top-4 left-4 select-none"
                style={{
                    opacity: opacity * 1.2,
                    fontSize: `${fontSize - 2}px`,
                    fontWeight: 600,
                    color: "#666",
                    userSelect: "none",
                    pointerEvents: "none",
                }}
            >
                {userName} • {userEmail}
            </div>
            <div
                className="absolute top-4 right-4 select-none text-right"
                style={{
                    opacity: opacity * 1.2,
                    fontSize: `${fontSize - 2}px`,
                    fontWeight: 600,
                    color: "#666",
                    userSelect: "none",
                    pointerEvents: "none",
                }}
            >
                IP: {ipAddress}
            </div>
            <div
                className="absolute bottom-4 left-4 select-none"
                style={{
                    opacity: opacity * 1.2,
                    fontSize: `${fontSize - 2}px`,
                    fontWeight: 600,
                    color: "#666",
                    userSelect: "none",
                    pointerEvents: "none",
                }}
            >
                {currentTime.toLocaleString()}
            </div>
            <div
                className="absolute bottom-4 right-4 select-none text-right"
                style={{
                    opacity: opacity * 1.2,
                    fontSize: `${fontSize - 2}px`,
                    fontWeight: 600,
                    color: "#666",
                    userSelect: "none",
                    pointerEvents: "none",
                }}
            >
                CONFIDENTIAL
            </div>
        </div>
    );
}
