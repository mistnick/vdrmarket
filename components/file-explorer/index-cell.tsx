"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    isValidIndex,
    isUniqueIndex,
    highlightIndexMatch,
} from "@/lib/utils/index-utils";
import type { IndexedItem, IndexValidationResult } from "@/types/index-types";

interface IndexCellProps {
    item: IndexedItem;
    canEdit: boolean;
    existingIndices: (string | null)[];
    onIndexChange: (itemId: string, newIndex: string | null) => Promise<void>;
    searchQuery?: string;
}

export function IndexCell({
    item,
    canEdit,
    existingIndices,
    onIndexChange,
    searchQuery = "",
}: IndexCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(item.index || "");
    const [validation, setValidation] = useState<IndexValidationResult>({ isValid: true });
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset edit value when item.index changes
    useEffect(() => {
        if (!isEditing) {
            setEditValue(item.index || "");
        }
    }, [item.index, isEditing]);

    // Focus input when entering edit mode
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Validate the current edit value
    const validate = useCallback(
        (value: string): IndexValidationResult => {
            if (!value || value.trim() === "") {
                return { isValid: true }; // Empty is valid
            }

            const trimmedValue = value.trim();

            if (!isValidIndex(trimmedValue)) {
                return {
                    isValid: false,
                    error: "invalid_format",
                    message: "Invalid format. Use numbers separated by dots (e.g., 1.2.3)",
                };
            }

            // Check uniqueness, excluding the current item
            const otherIndices = existingIndices.filter(
                (idx, i) => idx !== item.index || i !== existingIndices.indexOf(item.index)
            );

            if (!isUniqueIndex(trimmedValue, otherIndices, item.index)) {
                return {
                    isValid: false,
                    error: "duplicate",
                    message: "This index is already used by another item",
                };
            }

            return { isValid: true };
        },
        [existingIndices, item.index]
    );

    // Handle value change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setEditValue(newValue);
        setValidation(validate(newValue));
    };

    // Start editing
    const startEditing = () => {
        if (!canEdit) return;
        setIsEditing(true);
        setEditValue(item.index || "");
        setValidation({ isValid: true });
    };

    // Commit changes
    const commitEdit = async () => {
        if (!validation.isValid) {
            // Keep old value on invalid input
            setEditValue(item.index || "");
            setValidation({ isValid: true });
            setIsEditing(false);
            return;
        }

        const newIndex = editValue.trim() || null;

        // Only save if changed
        if (newIndex !== item.index) {
            setIsSaving(true);
            try {
                await onIndexChange(item.id, newIndex);
            } catch (error) {
                console.error("Failed to update index:", error);
                // Revert on error
                setEditValue(item.index || "");
            } finally {
                setIsSaving(false);
            }
        }

        setIsEditing(false);
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditValue(item.index || "");
        setValidation({ isValid: true });
        setIsEditing(false);
    };

    // Handle keyboard events
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            commitEdit();
        } else if (e.key === "Escape") {
            e.preventDefault();
            cancelEdit();
        }
    };

    // Render highlighted index for search
    const renderHighlightedIndex = () => {
        if (!item.index) {
            return <span className="text-muted-foreground">—</span>;
        }

        const segments = highlightIndexMatch(item.index, searchQuery);

        return (
            <span className="font-mono text-sm">
                {segments.map((segment, idx) => (
                    <span
                        key={idx}
                        className={cn(
                            segment.highlighted && "bg-yellow-200 dark:bg-yellow-800 rounded px-0.5"
                        )}
                    >
                        {segment.text}
                    </span>
                ))}
            </span>
        );
    };

    // Editing mode
    if (isEditing) {
        return (
            <div className="relative">
                <Input
                    ref={inputRef}
                    value={editValue}
                    onChange={handleChange}
                    onBlur={commitEdit}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                    className={cn(
                        "h-7 w-full font-mono text-sm px-2",
                        !validation.isValid && "border-destructive focus-visible:ring-destructive"
                    )}
                    placeholder="—"
                    aria-label="Item index, editable"
                    aria-invalid={!validation.isValid}
                />
                {!validation.isValid && validation.message && (
                    <TooltipProvider>
                        <Tooltip open>
                            <TooltipTrigger asChild>
                                <div className="absolute inset-0" />
                            </TooltipTrigger>
                            <TooltipContent
                                side="bottom"
                                className="bg-destructive text-destructive-foreground"
                            >
                                {validation.message}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
        );
    }

    // Read-only display
    return (
        <div
            className={cn(
                "px-2 py-1 rounded min-h-[28px] flex items-center",
                canEdit && "cursor-pointer hover:bg-muted/50 transition-colors"
            )}
            onClick={startEditing}
            onKeyDown={(e) => {
                if (canEdit && e.key === "Enter") {
                    e.preventDefault();
                    startEditing();
                }
            }}
            tabIndex={canEdit ? 0 : undefined}
            role={canEdit ? "button" : undefined}
            aria-label={canEdit ? "Item index, editable. Press Enter to edit." : "Item index"}
        >
            {renderHighlightedIndex()}
        </div>
    );
}
