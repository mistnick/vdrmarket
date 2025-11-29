/**
 * Utility functions for hierarchical index management in Virtual Data Rooms
 * Supports indices like "1", "1.1", "1.2.3", etc.
 */

/**
 * Regular expression pattern for valid index strings
 * Allows formats like: "1", "1.2", "1.2.3", "10.20.30"
 */
export const INDEX_PATTERN = /^\d+(\.\d+)*$/;

/**
 * Parse an index string into an array of numbers
 * @param index - Index string like "1.2.3"
 * @returns Array of numbers like [1, 2, 3]
 */
export function parseIndex(index: string | null | undefined): number[] {
    if (!index || !INDEX_PATTERN.test(index)) {
        return [];
    }
    return index.split(".").map((part) => parseInt(part, 10));
}

/**
 * Format an array of numbers back into an index string
 * @param parts - Array of numbers like [1, 2, 3]
 * @returns Index string like "1.2.3"
 */
export function formatIndex(parts: number[]): string {
    return parts.join(".");
}

/**
 * Compare two index strings for sorting
 * Returns negative if a < b, positive if a > b, 0 if equal
 * Handles hierarchical comparison: 1.2 < 1.10 < 1.10.1 < 2
 * @param a - First index string
 * @param b - Second index string
 * @returns Comparison result (-1, 0, or 1)
 */
export function compareIndex(a: string | null | undefined, b: string | null | undefined): number {
    const partsA = parseIndex(a);
    const partsB = parseIndex(b);

    // Items without index go to the end
    if (partsA.length === 0 && partsB.length === 0) return 0;
    if (partsA.length === 0) return 1;
    if (partsB.length === 0) return -1;

    const maxLength = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < maxLength; i++) {
        const numA = partsA[i] ?? 0;
        const numB = partsB[i] ?? 0;

        if (numA !== numB) {
            return numA - numB;
        }
    }

    // If all compared parts are equal, shorter index comes first
    // e.g., "1.2" comes before "1.2.1"
    return partsA.length - partsB.length;
}

/**
 * Validate an index string
 * @param index - Index string to validate
 * @returns true if valid, false otherwise
 */
export function isValidIndex(index: string | null | undefined): boolean {
    if (!index) return false;
    return INDEX_PATTERN.test(index);
}

/**
 * Check if an index is unique within a list of existing indices
 * @param index - Index to check
 * @param existingIndices - List of existing indices
 * @param excludeIndex - Optional index to exclude from comparison (for editing)
 * @returns true if unique, false if duplicate
 */
export function isUniqueIndex(
    index: string,
    existingIndices: (string | null | undefined)[],
    excludeIndex?: string | null
): boolean {
    return !existingIndices.some(
        (existing) => existing && existing !== excludeIndex && existing === index
    );
}

/**
 * Get the next available index at the current level
 * Finds the highest index at the given level and increments it
 * @param existingIndices - List of existing indices in the current folder
 * @param parentIndex - Optional parent index to prepend (for nested items)
 * @returns Next available index string
 */
export function getNextIndex(
    existingIndices: (string | null | undefined)[],
    parentIndex?: string | null
): string {
    // If parent has no index, just find the next simple number among existing
    if (!parentIndex || !isValidIndex(parentIndex)) {
        // Find the maximum top-level number from all existing indices
        let maxNumber = 0;
        for (const idx of existingIndices) {
            if (!idx || !isValidIndex(idx)) continue;
            const parts = parseIndex(idx);
            // Look at the first number of each index
            const firstNumber = parts[0] || 0;
            if (firstNumber > maxNumber) {
                maxNumber = firstNumber;
            }
        }
        return String(maxNumber + 1);
    }

    // Parent has an index - find children of that parent
    const parentParts = parseIndex(parentIndex);
    const validIndices = existingIndices
        .filter((idx): idx is string => isValidIndex(idx))
        .filter((idx) => {
            const parts = parseIndex(idx);
            // Check if this index is a direct child of the parent
            if (parts.length !== parentParts.length + 1) return false;
            for (let i = 0; i < parentParts.length; i++) {
                if (parts[i] !== parentParts[i]) return false;
            }
            return true;
        });

    // Find the maximum last number among children
    let maxNumber = 0;
    for (const idx of validIndices) {
        const parts = parseIndex(idx);
        const lastNumber = parts[parts.length - 1] || 0;
        if (lastNumber > maxNumber) {
            maxNumber = lastNumber;
        }
    }

    // Generate next index as child of parent
    return `${parentIndex}.${maxNumber + 1}`;
}

/**
 * Get all indices at a specific depth/level
 * @param existingIndices - List of all indices
 * @param depth - Target depth (1 = root level like "1", "2"; 2 = like "1.1", "1.2")
 * @returns Filtered list of indices at the specified depth
 */
export function getIndicesAtDepth(
    existingIndices: (string | null | undefined)[],
    depth: number
): string[] {
    return existingIndices
        .filter((idx): idx is string => isValidIndex(idx))
        .filter((idx) => parseIndex(idx).length === depth);
}

/**
 * Get the parent index of a given index
 * @param index - Index string like "1.2.3"
 * @returns Parent index like "1.2" or null if already at root
 */
export function getParentIndex(index: string | null | undefined): string | null {
    const parts = parseIndex(index);
    if (parts.length <= 1) return null;
    return formatIndex(parts.slice(0, -1));
}

/**
 * Get the depth/level of an index
 * @param index - Index string
 * @returns Depth (1 for "1", 2 for "1.1", etc.)
 */
export function getIndexDepth(index: string | null | undefined): number {
    return parseIndex(index).length;
}

/**
 * Check if indexA is a descendant of indexB
 * @param indexA - Potential descendant index
 * @param indexB - Potential ancestor index
 * @returns true if A is a descendant of B
 */
export function isDescendantIndex(
    indexA: string | null | undefined,
    indexB: string | null | undefined
): boolean {
    const partsA = parseIndex(indexA);
    const partsB = parseIndex(indexB);

    if (partsA.length <= partsB.length) return false;

    for (let i = 0; i < partsB.length; i++) {
        if (partsA[i] !== partsB[i]) return false;
    }

    return true;
}

/**
 * Renumber indices sequentially starting from 1
 * Preserves the current order but assigns clean sequential numbers
 * @param indices - Array of indices in the desired order
 * @param parentIndex - Optional parent index for nested items
 * @returns Map of old index to new index
 */
export function renumberIndicesSequentially(
    indices: (string | null | undefined)[],
    parentIndex?: string | null
): Map<string, string> {
    const result = new Map<string, string>();
    let counter = 1;

    for (const oldIndex of indices) {
        if (!isValidIndex(oldIndex)) continue;

        const newIndex = parentIndex ? `${parentIndex}.${counter}` : String(counter);
        if (oldIndex) {
            result.set(oldIndex, newIndex);
        }
        counter++;
    }

    return result;
}

/**
 * Sort items by their index using hierarchical comparison
 * @param items - Array of items with index property
 * @param getIndex - Function to extract index from item
 * @returns Sorted array
 */
export function sortByIndex<T>(items: T[], getIndex: (item: T) => string | null | undefined): T[] {
    return [...items].sort((a, b) => compareIndex(getIndex(a), getIndex(b)));
}

/**
 * Highlight matching portions of an index for search results
 * @param index - The full index string
 * @param searchQuery - The search query to highlight
 * @returns Array of { text: string, highlighted: boolean } segments
 */
export function highlightIndexMatch(
    index: string | null | undefined,
    searchQuery: string
): { text: string; highlighted: boolean }[] {
    if (!index) return [];
    if (!searchQuery) return [{ text: index, highlighted: false }];

    const normalizedQuery = searchQuery.toLowerCase();
    const normalizedIndex = index.toLowerCase();

    // Check for exact or prefix match
    const matchStart = normalizedIndex.indexOf(normalizedQuery);

    if (matchStart === -1) {
        return [{ text: index, highlighted: false }];
    }

    const segments: { text: string; highlighted: boolean }[] = [];

    if (matchStart > 0) {
        segments.push({
            text: index.substring(0, matchStart),
            highlighted: false,
        });
    }

    segments.push({
        text: index.substring(matchStart, matchStart + searchQuery.length),
        highlighted: true,
    });

    if (matchStart + searchQuery.length < index.length) {
        segments.push({
            text: index.substring(matchStart + searchQuery.length),
            highlighted: false,
        });
    }

    return segments;
}
