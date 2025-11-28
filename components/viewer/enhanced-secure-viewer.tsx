"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WatermarkOverlay } from "./watermark-overlay";
import { useSecurityProtection, SecurityViolationType } from "@/hooks/use-security-protection";
import {
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Loader2,
    AlertCircle,
    Shield,
    Download,
    Maximize2,
    Minimize2,
} from "lucide-react";

// Dynamically import react-pdf with SSR disabled to avoid DOMMatrix error
const Document = dynamic(
    () => import("react-pdf").then((mod) => mod.Document),
    { ssr: false }
);
const Page = dynamic(
    () => import("react-pdf").then((mod) => mod.Page),
    { ssr: false }
);

// Configure PDF.js worker - only on client side
if (typeof window !== "undefined") {
    import("react-pdf").then((pdfjs) => {
        pdfjs.pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.pdfjs.version}/pdf.worker.min.mjs`;
    });
}

export interface EnhancedSecureViewerProps {
    /** Document URL to display */
    documentUrl: string;
    /** Document filename */
    documentName: string;
    /** File MIME type */
    fileType: string;
    /** Viewer display name */
    userName: string;
    /** Viewer email */
    userEmail: string;
    /** Pre-fetched IP address */
    ipAddress?: string;
    /** Allow document download */
    allowDownload?: boolean;
    /** Allow printing */
    allowPrint?: boolean;
    /** Allow copying content */
    allowCopy?: boolean;
    /** Enable watermark overlay */
    enableWatermark?: boolean;
    /** Enable screenshot protection (blur on focus loss) */
    enableScreenshotProtection?: boolean;
    /** Custom watermark text */
    customWatermarkText?: string;
    /** Watermark opacity (0-1) */
    watermarkOpacity?: number;
    /** Callback when security violation is detected */
    onSecurityViolation?: (type: SecurityViolationType, count: number) => void;
    /** Callback when document is loaded */
    onDocumentLoad?: (numPages: number) => void;
    /** Callback when page changes */
    onPageChange?: (page: number) => void;
}

/**
 * Enhanced Secure Document Viewer
 * 
 * Features:
 * - PDF and image viewing with zoom/navigation
 * - Dynamic watermarks with user info, IP, and timestamp
 * - Screenshot prevention (blur overlay on focus loss)
 * - Print blocking (keyboard shortcuts + CSS)
 * - Copy/paste prevention
 * - Right-click context menu blocking
 * - DevTools detection
 * - Low-resolution print (when allowed)
 * - Security violation logging
 */
export function EnhancedSecureViewer({
    documentUrl,
    documentName,
    fileType,
    userName,
    userEmail,
    ipAddress,
    allowDownload = false,
    allowPrint = false,
    allowCopy = false,
    enableWatermark = true,
    enableScreenshotProtection = true,
    customWatermarkText,
    watermarkOpacity = 0.12,
    onSecurityViolation,
    onDocumentLoad,
    onPageChange,
}: EnhancedSecureViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<HTMLDivElement>(null);

    // Security protection hook
    const { isOverlayVisible, violationCount, lastViolation } = useSecurityProtection({
        blockPrint: !allowPrint,
        blockCopy: !allowCopy,
        blockSave: !allowDownload,
        blurOnFocusLoss: enableScreenshotProtection,
        blockScreenshotShortcuts: enableScreenshotProtection,
        blockContextMenu: !allowCopy,
        blockSelection: !allowCopy,
        blockDrag: true,
        detectDevTools: true,
        onSecurityViolation: (type) => {
            onSecurityViolation?.(type, violationCount + 1);
        },
    });

    // PDF load handlers
    const onDocumentLoadSuccess = useCallback(
        ({ numPages }: { numPages: number }) => {
            setNumPages(numPages);
            setLoading(false);
            onDocumentLoad?.(numPages);
        },
        [onDocumentLoad]
    );

    const onDocumentLoadError = useCallback((err: Error) => {
        console.error("Error loading PDF:", err);
        setError("Failed to load document. It might be corrupted or protected.");
        setLoading(false);
    }, []);

    // Navigation functions
    const goToPrevPage = useCallback(() => {
        setPageNumber((prev) => {
            const newPage = Math.max(prev - 1, 1);
            onPageChange?.(newPage);
            return newPage;
        });
    }, [onPageChange]);

    const goToNextPage = useCallback(() => {
        setPageNumber((prev) => {
            const newPage = Math.min(prev + 1, numPages);
            onPageChange?.(newPage);
            return newPage;
        });
    }, [numPages, onPageChange]);

    const zoomIn = useCallback(() => {
        setScale((prev) => Math.min(prev + 0.2, 3.0));
    }, []);

    const zoomOut = useCallback(() => {
        setScale((prev) => Math.max(prev - 0.2, 0.5));
    }, []);

    // Fullscreen toggle
    const toggleFullscreen = useCallback(() => {
        if (!viewerRef.current) return;

        if (!document.fullscreenElement) {
            viewerRef.current.requestFullscreen().catch((err) => {
                console.error("Error attempting fullscreen:", err);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    // Download handler
    const handleDownload = useCallback(async () => {
        if (!allowDownload) return;

        try {
            const response = await fetch(documentUrl);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = documentName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error("Download failed:", err);
        }
    }, [allowDownload, documentUrl, documentName]);

    // Low-resolution print handler (when print is allowed)
    const handlePrint = useCallback(() => {
        if (!allowPrint) return;

        // Create a low-resolution print version
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print - ${documentName}</title>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        font-family: system-ui, sans-serif;
                    }
                    .watermark {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(-45deg);
                        font-size: 48px;
                        color: rgba(0, 0, 0, 0.1);
                        white-space: nowrap;
                        pointer-events: none;
                        z-index: 9999;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid #ccc;
                    }
                    .content {
                        text-align: center;
                    }
                    .content img {
                        max-width: 100%;
                        max-height: 80vh;
                        /* Low resolution for print */
                        image-rendering: pixelated;
                    }
                    .footer {
                        margin-top: 20px;
                        padding-top: 10px;
                        border-top: 1px solid #ccc;
                        font-size: 10px;
                        color: #666;
                        text-align: center;
                    }
                    @media print {
                        .watermark {
                            color: rgba(0, 0, 0, 0.05);
                        }
                    }
                </style>
            </head>
            <body>
                <div class="watermark">${userName} • ${userEmail} • ${new Date().toLocaleString()}</div>
                <div class="header">
                    <h1>${documentName}</h1>
                    <p>Printed by: ${userName} (${userEmail})</p>
                </div>
                <div class="content">
                    <p>Document print preview</p>
                    <p style="color: #666; font-size: 12px;">Full document printing is restricted for security purposes.</p>
                </div>
                <div class="footer">
                    Printed: ${new Date().toLocaleString()} | IP: ${ipAddress || "Unknown"} | CONFIDENTIAL
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }, [allowPrint, documentName, userName, userEmail, ipAddress]);

    // Render unsupported file type message
    if (fileType !== "application/pdf" && !fileType.startsWith("image/")) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg shadow-sm border">
                <AlertCircle className="h-12 w-12 text-warning mb-4" />
                <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
                <p className="text-muted-foreground mb-4">
                    This file type ({fileType}) cannot be previewed in the secure viewer.
                </p>
                {allowDownload ? (
                    <Button onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Download to View
                    </Button>
                ) : (
                    <p className="text-sm text-destructive">
                        Downloading is disabled for this document.
                    </p>
                )}
            </div>
        );
    }

    // Render image viewer
    if (fileType.startsWith("image/")) {
        return (
            <div
                ref={viewerRef}
                className="secure-viewer-container relative h-full w-full overflow-hidden bg-muted"
            >
                {/* Watermark */}
                {enableWatermark && (
                    <WatermarkOverlay
                        userName={userName}
                        userEmail={userEmail}
                        ipAddress={ipAddress}
                        visible={true}
                        opacity={watermarkOpacity}
                        customText={customWatermarkText}
                        animated={enableScreenshotProtection}
                        antiManipulation={true}
                    />
                )}

                {/* Security Overlay */}
                {isOverlayVisible && (
                    <SecurityOverlay />
                )}

                {/* Image Content */}
                <div className="flex justify-center items-center p-4 min-h-[500px]">
                    <img
                        src={documentUrl}
                        alt={documentName}
                        className="max-w-full h-auto object-contain rounded shadow-lg"
                        style={{
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            pointerEvents: allowCopy ? "auto" : "none",
                        }}
                        onContextMenu={(e) => !allowCopy && e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                    />
                </div>
            </div>
        );
    }

    // Render PDF viewer
    return (
        <div
            ref={viewerRef}
            className="secure-viewer-container relative h-full w-full overflow-hidden bg-muted"
        >
            {/* Watermark */}
            {enableWatermark && (
                <WatermarkOverlay
                    userName={userName}
                    userEmail={userEmail}
                    ipAddress={ipAddress}
                    visible={true}
                    opacity={watermarkOpacity}
                    customText={customWatermarkText}
                    animated={enableScreenshotProtection}
                    antiManipulation={true}
                />
            )}

            {/* Security Overlay */}
            {isOverlayVisible && (
                <SecurityOverlay />
            )}

            {/* Viewer Toolbar */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-2 flex items-center justify-between shadow-sm">
                {/* Navigation Controls */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1 || loading}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[100px] text-center">
                        {loading ? "Loading..." : `Page ${pageNumber} of ${numPages}`}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages || loading}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={zoomOut} disabled={loading}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm min-w-[50px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button variant="outline" size="sm" onClick={zoomIn} disabled={loading}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? (
                            <Minimize2 className="h-4 w-4" />
                        ) : (
                            <Maximize2 className="h-4 w-4" />
                        )}
                    </Button>

                    {allowPrint && (
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            Print (Low-res)
                        </Button>
                    )}

                    {allowDownload && (
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                    )}
                </div>
            </div>

            {/* PDF Content */}
            <div
                ref={containerRef}
                className="overflow-auto flex justify-center items-start p-4"
                style={{
                    height: "calc(100vh - 120px)",
                    userSelect: allowCopy ? "text" : "none",
                    WebkitUserSelect: allowCopy ? "text" : "none",
                }}
            >
                {error ? (
                    <Alert variant="destructive" className="max-w-md my-auto">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : (
                    <Document
                        file={documentUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        }
                        className="shadow-lg"
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="bg-white"
                        />
                    </Document>
                )}
            </div>

            {/* Security Status Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-foreground/80 text-background text-xs px-4 py-1 flex items-center justify-between z-40">
                <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-success" />
                    Secure Viewer
                </span>
                <span className="opacity-60">
                    {userName} • {new Date().toLocaleTimeString()}
                </span>
            </div>
        </div>
    );
}

/**
 * Security overlay shown when potential security violation is detected
 */
function SecurityOverlay() {
    return (
        <div
            className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-lg flex items-center justify-center"
            style={{
                animation: "fadeIn 0.2s ease-out",
            }}
        >
            <div className="text-center text-white p-8 max-w-md">
                <Shield className="w-16 h-16 mx-auto mb-4 text-destructive animate-pulse" />
                <h2 className="text-2xl font-bold mb-2">Security Alert</h2>
                <p className="text-white/70 mb-4">
                    Screen capture and window switching are monitored for security purposes.
                </p>
                <p className="text-sm text-white/50">
                    Return focus to this window to continue viewing.
                </p>
                <div className="mt-6 text-xs text-white/40">
                    This activity may be logged.
                </div>
            </div>
        </div>
    );
}

// Add CSS keyframes for animation
if (typeof document !== "undefined") {
    const styleId = "enhanced-secure-viewer-styles";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.innerHTML = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}
