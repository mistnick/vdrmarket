"use client";

import { FileText } from "lucide-react";

interface DocumentPreviewProps {
    url: string;
    fileType: string;
}

export function DocumentPreview({ url, fileType }: DocumentPreviewProps) {
    // Mock preview for demo
    const isPdf = fileType === "pdf" || fileType.includes("pdf");
    const isImage = fileType.includes("image");

    if (isPdf) {
        return (
            <div className="w-full h-[600px] bg-slate-100 rounded-lg border flex items-center justify-center">
                <iframe
                    src={`${url}#toolbar=0`}
                    className="w-full h-full rounded-lg"
                    title="Document Preview"
                />
            </div>
        );
    }

    if (isImage) {
        return (
            <div className="w-full h-[600px] bg-slate-100 rounded-lg border flex items-center justify-center overflow-hidden">
                <img src={url} alt="Preview" className="max-w-full max-h-full object-contain" />
            </div>
        );
    }

    return (
        <div className="w-full h-[600px] bg-slate-50 rounded-lg border flex flex-col items-center justify-center text-slate-400">
            <FileText className="h-16 w-16 mb-4" />
            <p>Preview not available for this file type</p>
        </div>
    );
}
