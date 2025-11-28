"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    FileText,
    Folder,
    Database,
    Loader2,
    Clock,
    X,
    Download,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { searchHistory } from "@/lib/search/history";
import {
    SearchFiltersComponent,
    SearchFilters,
} from "@/components/shared/search-filters";
import { cn } from "@/lib/utils";

interface SearchResult {
    id: string;
    type: "document" | "folder" | "dataroom";
    title: string;
    description?: string;
    url: string;
    rank?: number;
    metadata?: {
        fileType?: string;
        updatedAt: string;
        dataRoomName?: string;
    };
}

interface AdvancedSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AdvancedSearchDialog({
    open,
    onOpenChange,
}: AdvancedSearchDialogProps) {
    const router = useRouter();
    const [query, setQuery] = React.useState("");
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [filters, setFilters] = React.useState<SearchFilters>({});
    const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
    const debouncedQuery = useDebounce(query, 300);

    // Load recent searches on mount
    React.useEffect(() => {
        if (open) {
            setRecentSearches(searchHistory.getRecentSearches(5));
        }
    }, [open]);

    // Perform search
    React.useEffect(() => {
        const fetchResults = async () => {
            if (debouncedQuery.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const params = new URLSearchParams({ q: debouncedQuery });
                if (filters.fileType) params.append("type", filters.fileType);
                if (filters.dateFrom)
                    params.append("dateFrom", filters.dateFrom.toISOString());
                if (filters.dateTo)
                    params.append("dateTo", filters.dateTo.toISOString());
                if (filters.tags?.length)
                    params.append("tags", filters.tags.join(","));

                const res = await fetch(`/api/search?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    // Transform API response to match SearchResult interface
                    const transformedResults = (data.data || data).map((item: any) => ({
                        id: item.id,
                        type: "document" as const,
                        title: item.name,
                        url: `/documents/${item.id}`,
                        rank: item.rank,
                        metadata: {
                            fileType: item.mimeType,
                            updatedAt: item.updatedAt,
                            dataRoomName: item.dataRoomName,
                        },
                    }));
                    setResults(transformedResults);
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery, filters]);

    const handleSelect = (result: SearchResult) => {
        // Save to history (convert dates to strings)
        const historyFilters = {
            ...filters,
            dateFrom: filters.dateFrom?.toISOString(),
            dateTo: filters.dateTo?.toISOString(),
        };
        searchHistory.addToHistory(query, historyFilters);
        setRecentSearches(searchHistory.getRecentSearches(5));

        // Navigate
        onOpenChange(false);
        router.push(result.url);
    };

    const handleRecentSearch = (recentQuery: string) => {
        setQuery(recentQuery);
    };

    const clearRecentSearches = () => {
        searchHistory.clearHistory();
        setRecentSearches([]);
    };

    const exportResults = () => {
        const csv = [
            ["Title", "Type", "Data Room", "Updated At", "Rank"].join(","),
            ...results.map((r) =>
                [
                    `"${r.title}"`,
                    r.type,
                    `"${r.metadata?.dataRoomName || ""}"`,
                    r.metadata?.updatedAt || "",
                    r.rank?.toFixed(4) || "",
                ].join(",")
            ),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `search-results-${new Date().toISOString()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "document":
                return <FileText className="h-4 w-4 text-info" />;
            case "folder":
                return <Folder className="h-4 w-4 text-warning" />;
            case "dataroom":
                return <Database className="h-4 w-4 text-success" />;
            default:
                return <Search className="h-4 w-4" />;
        }
    };

    const highlightText = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, "gi"));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === query.toLowerCase() ? (
                        <mark key={i} className="bg-warning/30 font-medium">
                            {part}
                        </mark>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Advanced Search</DialogTitle>
                    <DialogDescription>
                        Search across all documents, folders, and data rooms
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Type to search..."
                            className="pl-10 pr-10"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        {loading && (
                            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                        )}
                    </div>

                    {/* Filters */}
                    <SearchFiltersComponent
                        filters={filters}
                        onFiltersChange={setFilters}
                    />
                </div>

                {/* Results */}
                <ScrollArea className="h-[400px] px-6">
                    <div className="space-y-2 pb-6">
                        {/* Recent Searches */}
                        {query.length < 2 && recentSearches.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Recent Searches
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={clearRecentSearches}
                                    >
                                        Clear
                                    </Button>
                                </div>
                                {recentSearches.map((recent, idx) => (
                                    <button
                                        key={idx}
                                        className="flex w-full items-center gap-3 px-3 py-2 hover:bg-accent text-left transition-colors rounded-md"
                                        onClick={() => handleRecentSearch(recent)}
                                    >
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-foreground">{recent}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Search Results */}
                        {query.length >= 2 && (
                            <>
                                {results.length > 0 && (
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-muted-foreground">
                                            {results.length} results found
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={exportResults}
                                        >
                                            <Download className="h-3 w-3 mr-1" />
                                            Export CSV
                                        </Button>
                                    </div>
                                )}

                                {results.length > 0 ? (
                                    results.map((result) => (
                                        <button
                                            key={`${result.type}-${result.id}`}
                                            className="flex w-full items-start gap-3 px-3 py-3 hover:bg-accent text-left transition-colors rounded-md border"
                                            onClick={() => handleSelect(result)}
                                        >
                                            <div className="mt-1">{getIcon(result.type)}</div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-sm font-medium text-foreground">
                                                    {highlightText(result.title, query)}
                                                </p>
                                                {result.description && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {result.description}
                                                    </p>
                                                )}
                                                <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                                                    <Badge variant="outline" className="text-[10px] h-4">
                                                        {result.type}
                                                    </Badge>
                                                    {result.metadata?.dataRoomName && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{result.metadata.dataRoomName}</span>
                                                        </>
                                                    )}
                                                    {result.metadata?.updatedAt && (
                                                        <>
                                                            <span>•</span>
                                                            <span>
                                                                {new Date(
                                                                    result.metadata.updatedAt
                                                                ).toLocaleDateString()}
                                                            </span>
                                                        </>
                                                    )}
                                                    {result.rank && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-success font-medium">
                                                                Relevance: {(result.rank * 100).toFixed(0)}%
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    !loading && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p className="text-sm">No results found.</p>
                                            <p className="text-xs mt-1">
                                                Try different keywords or adjust your filters.
                                            </p>
                                        </div>
                                    )
                                )}
                            </>
                        )}

                        {/* Empty State */}
                        {query.length < 2 && recentSearches.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Start typing to search...</p>
                                <p className="text-xs mt-1">
                                    Search across documents, folders, and data rooms
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
