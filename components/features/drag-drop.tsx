/**
 * Drag and Drop Components for Folder Navigation
 * Uses @dnd-kit for folder/document management
 */

"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, Folder } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DraggableItem {
  id: string;
  name: string;
  type: "file" | "folder";
}

interface DraggableFolderListProps {
  items: DraggableItem[];
  onMove: (itemId: string, targetFolderId: string | null) => Promise<void>;
  onReorder?: (items: DraggableItem[]) => Promise<void>;
}

/**
 * Sortable Item Component
 */
function SortableItem({ item }: { item: DraggableItem }) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-move"
    >
      <Card className="p-4 mb-2 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          {item.type === "folder" ? (
            <Folder className="w-5 h-5 text-blue-500" />
          ) : (
            <FileText className="w-5 h-5 text-slate-500" />
          )}
          <span className="font-medium">{item.name}</span>
        </div>
      </Card>
    </div>
  );
}

/**
 * Draggable Folder List with Sorting
 */
export function DraggableFolderList({
  items,
  onMove,
  onReorder,
}: DraggableFolderListProps) {
  const [activeItem, setActiveItem] = useState<DraggableItem | null>(null);
  const [localItems, setLocalItems] = useState(items);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const item = localItems.find((i) => i.id === event.active.id);
    if (item) {
      setActiveItem(item);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Get items
    const activeItem = localItems.find((i) => i.id === active.id);
    const overItem = localItems.find((i) => i.id === over.id);

    if (!activeItem || !overItem) {
      return;
    }

    // Check if dropping on a folder
    if (overItem.type === "folder") {
      try {
        await onMove(activeItem.id, overItem.id);
        // Remove from current list after successful move
        setLocalItems((prev) => prev.filter((i) => i.id !== activeItem.id));
      } catch (error) {
        console.error("Failed to move item:", error);
      }
    } else if (onReorder) {
      // Reorder items in the same folder
      const oldIndex = localItems.findIndex((i) => i.id === active.id);
      const newIndex = localItems.findIndex((i) => i.id === over.id);

      if (oldIndex !== newIndex) {
        const newItems = [...localItems];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);
        
        setLocalItems(newItems);
        
        try {
          await onReorder(newItems);
        } catch (error) {
          console.error("Failed to reorder items:", error);
          setLocalItems(localItems); // Revert on error
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={localItems} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {localItems.map((item) => (
            <SortableItem key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem && (
          <Card className="p-4 shadow-lg border-2 border-blue-500 bg-white">
            <div className="flex items-center gap-3">
              {activeItem.type === "folder" ? (
                <Folder className="w-5 h-5 text-blue-500" />
              ) : (
                <FileText className="w-5 h-5 text-slate-500" />
              )}
              <span className="font-medium">{activeItem.name}</span>
            </div>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}

/**
 * Folder Tree View with Drag & Drop
 */
interface TreeNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: TreeNode[];
}

interface FolderTreeProps {
  tree: TreeNode[];
  onMove: (itemId: string, targetFolderId: string | null) => Promise<void>;
  onSelect?: (nodeId: string) => void;
  selectedId?: string;
}

export function FolderTree({ tree, onMove, onSelect, selectedId }: FolderTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={`
            flex items-center gap-2 p-2 rounded cursor-pointer
            hover:bg-slate-100 transition-colors
            ${isSelected ? "bg-blue-50 border border-blue-200" : ""}
          `}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(node.id);
            }
            onSelect?.(node.id);
          }}
        >
          {node.type === "folder" ? (
            <>
              <Folder className={`w-4 h-4 ${isExpanded ? "text-blue-600" : "text-blue-400"}`} />
              <span className="text-sm font-medium">{node.name}</span>
              {hasChildren && (
                <span className="ml-auto text-xs text-slate-500">
                  {node.children!.length}
                </span>
              )}
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-sm">{node.name}</span>
            </>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-2 bg-white">
      {tree.map((node) => renderNode(node))}
    </div>
  );
}
