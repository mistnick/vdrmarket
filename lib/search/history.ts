/**
 * Search History Manager
 * Manages search history using localStorage
 */

const STORAGE_KEY = "dataroom_search_history";
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
    query: string;
    timestamp: number;
    filters?: {
        type?: string;
        dateFrom?: string;
        dateTo?: string;
        tags?: string[];
    };
}

class SearchHistory {
    /**
     * Get search history from localStorage
     */
    getHistory(): SearchHistoryItem[] {
        if (typeof window === "undefined") return [];

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return [];

            return JSON.parse(stored) as SearchHistoryItem[];
        } catch (error) {
            console.error("Error reading search history:", error);
            return [];
        }
    }

    /**
     * Add a search query to history
     */
    addToHistory(query: string, filters?: SearchHistoryItem["filters"]): void {
        if (typeof window === "undefined") return;
        if (!query.trim()) return;

        try {
            const history = this.getHistory();

            // Remove duplicate if exists
            const filtered = history.filter((item) => item.query !== query);

            // Add new item at the beginning
            const newHistory = [
                { query, timestamp: Date.now(), filters },
                ...filtered,
            ].slice(0, MAX_HISTORY_ITEMS);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
        } catch (error) {
            console.error("Error saving search history:", error);
        }
    }

    /**
     * Clear all search history
     */
    clearHistory(): void {
        if (typeof window === "undefined") return;

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error("Error clearing search history:", error);
        }
    }

    /**
     * Remove a specific item from history
     */
    removeFromHistory(query: string): void {
        if (typeof window === "undefined") return;

        try {
            const history = this.getHistory();
            const filtered = history.filter((item) => item.query !== query);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error("Error removing from search history:", error);
        }
    }

    /**
     * Get recent searches (without filters)
     */
    getRecentSearches(limit: number = 5): string[] {
        return this.getHistory()
            .slice(0, limit)
            .map((item) => item.query);
    }
}

export const searchHistory = new SearchHistory();
