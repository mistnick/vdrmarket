"use client";

import { useEffect, useState, useRef } from "react";
import { WatermarkOverlay } from "./watermark-overlay";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { getSession } from "@/lib/auth/session";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface SecureDocumentViewerProps {
    documentUrl: string;
    documentName: string;
    userName: string;
    userEmail: string;
    allowDownload?: boolean;
    allowPrint?: boolean;
    allowCopy?: boolean;
}

export function SecureDocumentViewer({
    documentUrl,
    documentName,
    userName,
    userEmail,
    allowDownload = false,
    allowPrint = false,
    allowCopy = false,
}: SecureDocumentViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Disable right-click context menu
        const handleContextMenu = (e: MouseEvent) => {
            if (!allowCopy) {
                e.preventDefault();
                return false;
            }
        };

        // Disable text selection if copy is not allowed
        const handleSelectStart = (e: Event) => {
            if (!allowCopy) {
                e.preventDefault();
                return false;
            }
        };

        // Disable keyboard shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // Disable Print (Ctrl+P / Cmd+P)
            if (!allowPrint && (e.ctrlKey || e.metaKey) && e.key === "p") {
                e.preventDefault();
                return false;
            }

            // Disable Save (Ctrl+S / Cmd+S)
            if (!allowDownload && (e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                return false;
            }

            // Disable Copy (Ctrl+C / Cmd+C)
            if (!allowCopy && (e.ctrlKey || e.metaKey) && e.key === "c") {
                e.preventDefault();
                return false;
            }
        };

        // Disable print CSS media
        if (!allowPrint) {
            const style = document.createElement("style");
            style.id = "disable-print";
            style.innerHTML = "@media print { body { display: none !important; } }";
            document.head.appendChild(style);
        }

        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("selectstart", handleSelectStart);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("selectstart", handleSelectStart);
            document.removeEventListener("keydown", handleKeyDown);

            const printStyle = document.getElementById("disable-print");
            if (printStyle) {
                printStyle.remove();
            }
        };
    }, [allowCopy, allowPrint, allowDownload]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const goToPrevPage = () => {
        setPageNumber((prev) => Math.max(prev - 1, 1));
    };

    const goToNextPage = () => {
        setPageNumber((prev) => Math.min(prev + 1, numPages));
    };

    const zoomIn = () => {
        setScale((prev) => Math.min(prev + 0.2, 3.0));
    };

    const zoomOut = () => {
        setScale((prev) => Math.max(prev - 0.2, 0.5));
    };

    return (
        <div className="relative h-full w-full overflow-hidden bg-gray-100">
            {/* Watermark overlay */}
            <WatermarkOverlay
                userName={userName}
                userEmail={userEmail}
                visible={true}
            />

            {/* Viewer controls */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                        Page {pageNumber} of {numPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={zoomOut}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">{Math.round(scale * 100)}%</span>
                    <Button variant="outline" size="sm" onClick={zoomIn}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>

                <div className="text-sm font-medium text-gray-700">
                    {documentName}
                </div>
            </div>

            {/* PDF Viewer */}
            <div
                ref={containerRef}
                className="overflow-auto h-[calc(100vh-120px)] flex justify-center items-start p-4"
                style={{
                    userSelect: allowCopy ? "text" : "none",
                    WebkitUserSelect: allowCopy ? "text" : "none",
                    MozUserSelect: allowCopy ? "text" : "none",
                }}
            >
                <Document
                    file={documentUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="shadow-lg"
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                </Document>
            </div>
        </div>
    );
}
