"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SecureViewerProps {
    url: string;
    fileType: string;
    allowDownload: boolean;
    fileName: string;
}

export function SecureViewer({ url, fileType, allowDownload, fileName }: SecureViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setLoading(false);
    }

    function onDocumentLoadError(err: Error) {
        console.error("Error loading PDF:", err);
        setError("Failed to load document. It might be corrupted or protected.");
        setLoading(false);
    }

    const handleDownload = async () => {
        if (!allowDownload) return;

        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error("Download failed:", err);
        }
    };

    if (fileType !== "application/pdf" && !fileType.startsWith("image/")) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg shadow-sm border">
                <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
                <p className="text-gray-500 mb-4">
                    This file type ({fileType}) cannot be previewed in the secure viewer.
                </p>
                {allowDownload ? (
                    <Button onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Download to View
                    </Button>
                ) : (
                    <p className="text-sm text-red-500">
                        Downloading is disabled for this document.
                    </p>
                )}
            </div>
        );
    }

    if (fileType.startsWith("image/")) {
        return (
            <div className="flex justify-center bg-gray-100 p-4 rounded-lg overflow-auto max-h-[80vh]">
                <img
                    src={url}
                    alt={fileName}
                    className="max-w-full h-auto object-contain"
                    onContextMenu={(e) => e.preventDefault()}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full">
            {/* Toolbar */}
            <div className="sticky top-0 z-10 w-full bg-white border-b p-2 mb-4 flex items-center justify-between shadow-sm rounded-t-lg">
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                        disabled={pageNumber <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                        Page {pageNumber} of {numPages || "--"}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                        disabled={pageNumber >= numPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setScale(prev => Math.max(prev - 0.1, 0.5))}
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm w-12 text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setScale(prev => Math.min(prev + 0.1, 2.0))}
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>

                {allowDownload && (
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                )}
            </div>

            {/* PDF Viewer */}
            <div
                className="w-full bg-gray-100 p-4 rounded-b-lg min-h-[500px] flex justify-center overflow-auto max-h-[80vh]"
                onContextMenu={(e) => e.preventDefault()}
            >
                {error ? (
                    <Alert variant="destructive" className="max-w-md my-auto">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : (
                    <Document
                        file={url}
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
        </div>
    );
}
