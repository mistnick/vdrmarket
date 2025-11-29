"use client";

import { useState, useCallback, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    GripVertical,
    FileText,
    Folder,
    RefreshCw,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidIndex, isUniqueIndex } from "@/lib/utils/index-utils";
import type { IndexedItem, BulkIndexOperation } from "@/types/index-types";

interface ManageIndexingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: IndexedItem[];
    parentIndex?: string | null;
    onSave: (operations: BulkIndexOperation[]) => Promise<void>;
}

interface SortableRowProps {
    item: IndexedItem;
    index: number;
    editedIndex: string;
    validation: { isValid: boolean; message?: string };
    onIndexChange: (value: string) => void;
}

function SortableRow({
    item,
    index,
    editedIndex,
    validation,
    onIndexChange,
}: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className={cn(
                "group",
                isDragging && "opacity-50 bg-muted/50"
            )}
        >
            <TableCell className="w-10">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
            </TableCell>
            <TableCell className="w-20">
                <span className="text-sm text-muted-foreground">{index + 1}</span>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    {item.type === "folder" ? (
                        <Folder className="h-4 w-4 text-amber-500" />
                    ) : (
                        <FileText className="h-4 w-4 text-primary" />
                    )}
                    <span className="truncate max-w-[200px]">{item.name}</span>
                    <Badge variant="outline" className="text-xs">
                        {item.type}
                    </Badge>
                </div>
            </TableCell>
            <TableCell className="w-24">
                <span className="font-mono text-sm text-muted-foreground">
                    {item.index || "—"}
                </span>
            </TableCell>
            <TableCell className="w-32">
                <Input
                    value={editedIndex}
                    onChange={(e) => onIndexChange(e.target.value)}
                    className={cn(
                        "h-8 font-mono text-sm",
                        !validation.isValid && "border-destructive"
                    )}
                    placeholder="—"
                />
                {!validation.isValid && validation.message && (
                    <p className="text-xs text-destructive mt-1">
                        {validation.message}
                    </p>
                )}
            </TableCell>
        </TableRow>
    );
}

export function ManageIndexingDialog({
    open,
    onOpenChange,
    items: initialItems,
    parentIndex,
    onSave,
}: ManageIndexingDialogProps) {
    // Local state for drag-and-drop ordering
    const [orderedItems, setOrderedItems] = useState<IndexedItem[]>([]);
    const [editedIndices, setEditedIndices] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize state when dialog opens
    const initializeState = useCallback(() => {
        // Filter out datarooms and sort by current index
        const filteredItems = initialItems
            .filter((item) => item.type !== "dataroom")
            .sort((a, b) => {
                // Items with index come first, sorted by index
                if (a.index && b.index) {
                    const partsA = a.index.split(".").map(Number);
                    const partsB = b.index.split(".").map(Number);
                    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
                        const numA = partsA[i] || 0;
                        const numB = partsB[i] || 0;
                        if (numA !== numB) return numA - numB;
                    }
                    return 0;
                }
                if (a.index) return -1;
                if (b.index) return 1;
                return 0;
            });

        setOrderedItems(filteredItems);
        setEditedIndices(
            filteredItems.reduce(
                (acc, item) => ({
                    ...acc,
                    [item.id]: item.index || "",
                }),
                {}
            )
        );
        setHasChanges(false);
    }, [initialItems]);

    // Reset state when dialog opens
    if (open && orderedItems.length === 0 && initialItems.length > 0) {
        initializeState();
    }

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setOrderedItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);

                const newItems = [...items];
                const [removed] = newItems.splice(oldIndex, 1);
                newItems.splice(newIndex, 0, removed);

                return newItems;
            });
            setHasChanges(true);
        }
    };

    // Handle index change
    const handleIndexChange = (itemId: string, value: string) => {
        setEditedIndices((prev) => ({ ...prev, [itemId]: value }));
        setHasChanges(true);
    };

    // Validate an index
    const validateIndex = useCallback(
        (itemId: string, value: string): { isValid: boolean; message?: string } => {
            if (!value || value.trim() === "") {
                return { isValid: true };
            }

            const trimmed = value.trim();

            if (!isValidIndex(trimmed)) {
                return {
                    isValid: false,
                    message: "Invalid format",
                };
            }

            // Check for duplicates
            const otherIndices = Object.entries(editedIndices)
                .filter(([id]) => id !== itemId)
                .map(([, idx]) => idx)
                .filter((idx) => idx);

            if (!isUniqueIndex(trimmed, otherIndices)) {
                return {
                    isValid: false,
                    message: "Duplicate index",
                };
            }

            return { isValid: true };
        },
        [editedIndices]
    );

    // Renumber sequentially
    const handleRenumberSequentially = () => {
        const newIndices: Record<string, string> = {};
        let counter = 1;

        for (const item of orderedItems) {
            const newIndex = parentIndex
                ? `${parentIndex}.${counter}`
                : String(counter);
            newIndices[item.id] = newIndex;
            counter++;
        }

        setEditedIndices(newIndices);
        setHasChanges(true);
    };

    // Check if all validations pass
    const allValid = useMemo(() => {
        return orderedItems.every((item) => {
            const validation = validateIndex(item.id, editedIndices[item.id] || "");
            return validation.isValid;
        });
    }, [orderedItems, editedIndices, validateIndex]);

    // Generate operations for save
    const generateOperations = useCallback((): BulkIndexOperation[] => {
        const operations: BulkIndexOperation[] = [];

        for (const item of orderedItems) {
            const newIndex = editedIndices[item.id]?.trim() || null;
            if (newIndex !== item.index) {
                operations.push({
                    itemId: item.id,
                    oldIndex: item.index,
                    newIndex: newIndex || "",
                });
            }
        }

        return operations;
    }, [orderedItems, editedIndices]);

    // Handle save
    const handleSave = async () => {
        if (!allValid) return;

        setIsSaving(true);
        try {
            const operations = generateOperations();
            if (operations.length > 0) {
                await onSave(operations);
            }
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save indices:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Handle close
    const handleClose = () => {
        setOrderedItems([]);
        setEditedIndices({});
        setHasChanges(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage Indexing</DialogTitle>
                    <DialogDescription>
                        Drag items to reorder, edit indices manually, or use sequential renumbering.
                        {parentIndex && (
                            <span className="block mt-1">
                                Parent index: <code className="font-mono bg-muted px-1 rounded">{parentIndex}</code>
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-2 py-2 border-b">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRenumberSequentially}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Renumber Sequentially
                    </Button>
                    {hasChanges && (
                        <Badge variant="secondary" className="ml-auto">
                            Unsaved changes
                        </Badge>
                    )}
                </div>

                <ScrollArea className="flex-1 -mx-6 px-6">
                    {orderedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <AlertCircle className="h-8 w-8 mb-2" />
                            <p>No items to manage</p>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10"></TableHead>
                                        <TableHead className="w-20">#</TableHead>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="w-24">Current</TableHead>
                                        <TableHead className="w-32">New Index</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <SortableContext
                                        items={orderedItems.map((i) => i.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {orderedItems.map((item, index) => (
                                            <SortableRow
                                                key={item.id}
                                                item={item}
                                                index={index}
                                                editedIndex={editedIndices[item.id] || ""}
                                                validation={validateIndex(
                                                    item.id,
                                                    editedIndices[item.id] || ""
                                                )}
                                                onIndexChange={(value) =>
                                                    handleIndexChange(item.id, value)
                                                }
                                            />
                                        ))}
                                    </SortableContext>
                                </TableBody>
                            </Table>
                        </DndContext>
                    )}
                </ScrollArea>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={handleClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !allValid || !hasChanges}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
