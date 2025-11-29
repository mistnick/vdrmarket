"use client";

import { useState, useCallback, useMemo } from "react";
import {
    isValidIndex,
    isUniqueIndex,
    compareIndex,
    getNextIndex,
} from "@/lib/utils/index-utils";
import type {
    IndexedItem,
    IndexValidationResult,
    IndexEditState,
    IndexSortDirection,
    BulkIndexOperation,
} from "@/types/index-types";

interface UseIndexManagementOptions {
    items: IndexedItem[];
    onIndexUpdate?: (itemId: string, newIndex: string | null) => Promise<void>;
    onBulkIndexUpdate?: (operations: BulkIndexOperation[]) => Promise<void>;
}

interface UseIndexManagementReturn {
    // Sorting
    sortDirection: IndexSortDirection;
    cycleSortDirection: () => void;
    sortedItems: IndexedItem[];

    // Editing
    editingState: IndexEditState | null;
    startEditing: (itemId: string, currentValue: string | null) => void;
    updateEditValue: (value: string) => void;
    commitEdit: () => Promise<void>;
    cancelEdit: () => void;
    validateIndex: (value: string, excludeItemId?: string) => IndexValidationResult;

    // Index generation
    getNextAvailableIndex: (parentIndex?: string | null) => string;

    // Bulk operations
    renumberSequentially: () => BulkIndexOperation[];
    saveBulkOperations: (operations: BulkIndexOperation[]) => Promise<void>;

    // Search helpers
    filterByIndexOrName: (searchQuery: string) => IndexedItem[];
}

/**
 * Hook for managing hierarchical indices in the file explorer
 */
export function useIndexManagement({
    items,
    onIndexUpdate,
    onBulkIndexUpdate,
}: UseIndexManagementOptions): UseIndexManagementReturn {
    const [sortDirection, setSortDirection] = useState<IndexSortDirection>(null);
    const [editingState, setEditingState] = useState<IndexEditState | null>(null);

    // Get all existing indices from items
    const existingIndices = useMemo(() => {
        return items.map((item) => item.index);
    }, [items]);

    // Cycle through sort directions: null -> asc -> desc -> null
    const cycleSortDirection = useCallback(() => {
        setSortDirection((prev) => {
            if (prev === null) return "asc";
            if (prev === "asc") return "desc";
            return null;
        });
    }, []);

    // Sort items by index
    const sortedItems = useMemo(() => {
        if (sortDirection === null) return items;

        return [...items].sort((a, b) => {
            // Always keep folders before files when sorting
            const typeOrder = { dataroom: 0, folder: 1, file: 2 };
            if (a.type !== b.type) {
                return typeOrder[a.type] - typeOrder[b.type];
            }

            const comparison = compareIndex(a.index, b.index);
            return sortDirection === "asc" ? comparison : -comparison;
        });
    }, [items, sortDirection]);

    // Validate an index value
    const validateIndex = useCallback(
        (value: string, excludeItemId?: string): IndexValidationResult => {
            if (!value || value.trim() === "") {
                return {
                    isValid: true, // Empty is valid (no index)
                };
            }

            const trimmedValue = value.trim();

            if (!isValidIndex(trimmedValue)) {
                return {
                    isValid: false,
                    error: "invalid_format",
                    message: "Invalid format. Use numbers separated by dots (e.g., 1.2.3)",
                };
            }

            const indicesToCheck = excludeItemId
                ? existingIndices.filter((_, idx) => items[idx]?.id !== excludeItemId)
                : existingIndices;

            if (!isUniqueIndex(trimmedValue, indicesToCheck)) {
                return {
                    isValid: false,
                    error: "duplicate",
                    message: "This index is already used by another item",
                };
            }

            return { isValid: true };
        },
        [existingIndices, items]
    );

    // Start editing an index
    const startEditing = useCallback(
        (itemId: string, currentValue: string | null) => {
            const validation = validateIndex(currentValue || "", itemId);
            setEditingState({
                itemId,
                originalValue: currentValue,
                currentValue: currentValue || "",
                isEditing: true,
                validationResult: validation,
            });
        },
        [validateIndex]
    );

    // Update the edit value and revalidate
    const updateEditValue = useCallback(
        (value: string) => {
            setEditingState((prev) => {
                if (!prev) return null;
                const validation = validateIndex(value, prev.itemId);
                return {
                    ...prev,
                    currentValue: value,
                    validationResult: validation,
                };
            });
        },
        [validateIndex]
    );

    // Commit the edit
    const commitEdit = useCallback(async () => {
        if (!editingState || !onIndexUpdate) return;

        const { itemId, currentValue, originalValue, validationResult } = editingState;

        if (!validationResult.isValid) {
            // Don't commit invalid values, keep editing
            return;
        }

        const newIndex = currentValue.trim() || null;

        // Only update if value changed
        if (newIndex !== originalValue) {
            try {
                await onIndexUpdate(itemId, newIndex);
            } catch (error) {
                console.error("Failed to update index:", error);
                // Revert to original on error
                setEditingState(null);
                return;
            }
        }

        setEditingState(null);
    }, [editingState, onIndexUpdate]);

    // Cancel editing
    const cancelEdit = useCallback(() => {
        setEditingState(null);
    }, []);

    // Get the next available index
    const getNextAvailableIndex = useCallback(
        (parentIndex?: string | null) => {
            return getNextIndex(existingIndices, parentIndex);
        },
        [existingIndices]
    );

    // Generate sequential renumbering operations
    const renumberSequentially = useCallback((): BulkIndexOperation[] => {
        const operations: BulkIndexOperation[] = [];
        let counter = 1;

        // Sort by current index first to preserve relative order
        const sorted = [...items].sort((a, b) => compareIndex(a.index, b.index));

        for (const item of sorted) {
            if (item.type === "dataroom") continue; // Skip datarooms

            const newIndex = String(counter);
            if (item.index !== newIndex) {
                operations.push({
                    itemId: item.id,
                    oldIndex: item.index,
                    newIndex,
                });
            }
            counter++;
        }

        return operations;
    }, [items]);

    // Save bulk operations
    const saveBulkOperations = useCallback(
        async (operations: BulkIndexOperation[]) => {
            if (!onBulkIndexUpdate) return;
            await onBulkIndexUpdate(operations);
        },
        [onBulkIndexUpdate]
    );

    // Filter items by index or name
    const filterByIndexOrName = useCallback(
        (searchQuery: string): IndexedItem[] => {
            if (!searchQuery) return items;

            const query = searchQuery.toLowerCase();

            return items.filter((item) => {
                // Match by name
                if (item.name.toLowerCase().includes(query)) return true;

                // Match by index (exact or prefix)
                if (item.index) {
                    const normalizedIndex = item.index.toLowerCase();
                    if (normalizedIndex.includes(query)) return true;
                    // Prefix match: searching "1.2" should match "1.2.1", "1.2.2"
                    if (normalizedIndex.startsWith(query)) return true;
                }

                return false;
            });
        },
        [items]
    );

    return {
        sortDirection,
        cycleSortDirection,
        sortedItems,
        editingState,
        startEditing,
        updateEditValue,
        commitEdit,
        cancelEdit,
        validateIndex,
        getNextAvailableIndex,
        renumberSequentially,
        saveBulkOperations,
        filterByIndexOrName,
    };
}
