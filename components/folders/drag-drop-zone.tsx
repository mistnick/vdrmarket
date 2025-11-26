"use client";

import { useState, DragEvent } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface DragDropZoneProps {
    folderId: string;
    onDocumentMoved?: (documentId: string, targetFolderId: string) => void;
    children: React.ReactNode;
    className?: string;
}

export function DragDropZone({
    folderId,
    onDocumentMoved,
    children,
    className,
}: DragDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragCounter, setDragCounter] = useState(0);

    const handleDragEnter = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter((prev) => prev + 1);
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter((prev) => {
            const newCount = prev - 1;
            if (newCount === 0) {
                setIsDragging(false);
            }
            return newCount;
        });
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsDragging(false);
        setDragCounter(0);

        const documentId = e.dataTransfer.getData("documentId");

        if (documentId && onDocumentMoved) {
            try {
                const response = await fetch(`/api/documents/${documentId}/move`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ folderId }),
                });

                if (response.ok) {
                    onDocumentMoved(documentId, folderId);
                } else {
                    console.error("Failed to move document");
                }
            } catch (error) {
                console.error("Error moving document:", error);
            }
        }
    };

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
                "relative transition-colors",
                isDragging && "bg-blue-50 border-2 border-dashed border-blue-400 rounded-lg",
                className
            )}
        >
            {children}

            {isDragging && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-50/90 rounded-lg pointer-events-none z-10">
                    <div className="text-center">
                        <Upload className="h-12 w-12 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-medium text-blue-900">
                            Drop document here to move
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Draggable Document Item Component
interface DraggableDocumentProps {
    documentId: string;
    children: React.ReactNode;
    className?: string;
}

export function DraggableDocument({
    documentId,
    children,
    className,
}: DraggableDocumentProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = (e: DragEvent) => {
        e.dataTransfer.setData("documentId", documentId);
        e.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={cn(
                "cursor-move transition-opacity",
                isDragging && "opacity-50",
                className
            )}
        >
            {children}
        </div>
    );
}
