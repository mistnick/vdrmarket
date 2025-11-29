"use client";

import * as React from "react";
import { Search, FileText, Folder, Database, Loader2, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { searchHistory } from "@/lib/search/history";
import { AdvancedSearchDialog } from "./advanced-search-dialog";

interface SearchResult {
    id: string;
    type: "document" | "folder" | "dataroom";
    title: string;
    description?: string;
    url: string;
    metadata?: {
        fileType?: string;
        updatedAt: string;
    };
}

export function GlobalSearch() {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [advancedOpen, setAdvancedOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [loading, setLoading] = React.useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Keyboard shortcut: Cmd/Ctrl + K
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setAdvancedOpen(true);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    React.useEffect(() => {
        const fetchResults = async () => {
            if (debouncedQuery.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
                    credentials: "include"
                });
                if (res.ok) {
                    const data = await res.json();
                    // Transform API response
                    const transformedResults = (data.data || data).map((item: any) => ({
                        id: item.id,
                        type: "document" as const,
                        title: item.name,
                        url: `/documents/${item.id}`,
                        metadata: {
                            fileType: item.mimeType,
                            updatedAt: item.updatedAt,
                        },
                    }));
                    setResults(transformedResults);
                    setOpen(true);
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (url: string) => {
        // Save to history
        searchHistory.addToHistory(query);

        setOpen(false);
        setQuery("");
        router.push(url);
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
        <>
            <div className="relative w-full max-w-2xl" ref={containerRef}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search documents, folders, data rooms... (⌘K)"
                        className="pl-10 pr-24 border-border focus-visible:ring-primary"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (e.target.value.length >= 2) setOpen(true);
                        }}
                        onFocus={() => {
                            if (results.length > 0) setOpen(true);
                        }}
                    />
                    {loading && (
                        <Loader2 className="absolute right-20 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
                        onClick={() => setAdvancedOpen(true)}
                    >
                        <Command className="h-3 w-3 mr-1" />K
                    </Button>
                </div>

                {open && (
                    <div className="absolute top-full mt-2 w-full rounded-md border border-border bg-popover shadow-lg z-50 overflow-hidden">
                        <div className="flex border-b">
                            <button className="flex-1 py-2 text-sm font-medium text-primary border-b-2 border-primary">Standard</button>
                            <button
                                className="flex-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    setOpen(false);
                                    setAdvancedOpen(true);
                                }}
                            >
                                Advanced ⌘K
                            </button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto py-2">
                            {results.length > 0 ? (
                                results.map((result) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        className="flex w-full items-start gap-3 px-4 py-2 hover:bg-accent text-left transition-colors"
                                        onClick={() => handleSelect(result.url)}
                                    >
                                        <div className="mt-1">{getIcon(result.type)}</div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="truncate text-sm font-medium text-foreground">
                                                {highlightText(result.title, query)}
                                            </p>
                                            {result.description && (
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {highlightText(result.description, query)}
                                                </p>
                                            )}
                                            <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                                                <span>{result.type}</span>
                                                {result.metadata?.updatedAt && (
                                                    <>
                                                        <span>•</span>
                                                        <span>
                                                            {new Date(result.metadata.updatedAt).toLocaleDateString()}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                !loading && query.length >= 2 && (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No results found.
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Advanced Search Dialog */}
            <AdvancedSearchDialog
                open={advancedOpen}
                onOpenChange={setAdvancedOpen}
            />
        </>
    );
}
