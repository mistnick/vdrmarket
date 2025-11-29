/**
 * Types for the hierarchical index system in Virtual Data Rooms
 */

/**
 * Extended file/folder item with index support
 */
export interface IndexedItem {
    id: string;
    name: string;
    type: "file" | "folder" | "dataroom";
    index: string | null;
    labels?: string[];
    notes?: string;
    size?: number;
    fileType?: string;
    dataRoomId?: string;
    folderId?: string;
    parentId?: string;
    createdAt?: string;
    children?: IndexedItem[];
}

/**
 * Index validation result
 */
export interface IndexValidationResult {
    isValid: boolean;
    error?: "invalid_format" | "duplicate" | "empty";
    message?: string;
}

/**
 * Index editing state for a single cell
 */
export interface IndexEditState {
    itemId: string;
    originalValue: string | null;
    currentValue: string;
    isEditing: boolean;
    validationResult: IndexValidationResult;
}

/**
 * Props for the index cell component
 */
export interface IndexCellProps {
    item: IndexedItem;
    canEdit: boolean;
    existingIndices: (string | null)[];
    onIndexChange: (itemId: string, newIndex: string | null) => Promise<void>;
    searchQuery?: string;
}

/**
 * Bulk index operation for the manage dialog
 */
export interface BulkIndexOperation {
    itemId: string;
    oldIndex: string | null;
    newIndex: string;
}

/**
 * Props for the manage indexing dialog
 */
export interface ManageIndexingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: IndexedItem[];
    parentIndex?: string | null;
    onSave: (operations: BulkIndexOperation[]) => Promise<void>;
}

/**
 * Sort direction for index column
 */
export type IndexSortDirection = "asc" | "desc" | null;

/**
 * Index column header props
 */
export interface IndexColumnHeaderProps {
    sortDirection: IndexSortDirection;
    onSort: () => void;
}

/**
 * API response types for index updates
 */
export interface IndexUpdateRequest {
    index: string | null;
}

export interface IndexUpdateResponse {
    success: boolean;
    data?: {
        id: string;
        index: string | null;
    };
    error?: string;
}

/**
 * Bulk index update request
 */
export interface BulkIndexUpdateRequest {
    updates: Array<{
        id: string;
        type: "file" | "folder";
        index: string | null;
    }>;
}

/**
 * Sidebar item with index badge
 */
export interface SidebarIndexedItem {
    id: string;
    name: string;
    index: string | null;
    type: "folder" | "dataroom";
    children?: SidebarIndexedItem[];
}
