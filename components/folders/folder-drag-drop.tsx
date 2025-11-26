import React from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Folder } from "@prisma/client";

/**
 * Simple drag‑and‑drop list for folders.
 * This is a placeholder component – you can extend it to handle moving documents between folders.
 */
export function FolderDragDrop({ folders, onOrderChange }: { folders: Folder[]; onOrderChange: (newOrder: Folder[]) => void }) {
    const [items, setItems] = React.useState(folders.map((f) => f.id));

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = items.indexOf(active.id);
            const newIndex = items.indexOf(over?.id);
            const newOrder = arrayMove(items, oldIndex, newIndex);
            setItems(newOrder);
            const reorderedFolders = newOrder.map((id) => folders.find((f) => f.id === id)!).filter(Boolean);
            onOrderChange(reorderedFolders);
        }
    };

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                {items.map((id) => (
                    <SortableFolder key={id} id={id} folders={folders} />
                ))}
            </SortableContext>
        </DndContext>
    );
}

function SortableFolder({ id, folders }: { id: string; folders: Folder[] }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        padding: "8px 12px",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        marginBottom: "4px",
        background: "#fff",
        cursor: "grab",
    };
    const folder = folders.find((f) => f.id === id);
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {folder?.name ?? "Folder"}
        </div>
    );
}
