"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Tag, Plus, Loader2 } from "lucide-react";

interface Tag {
    id: string;
    name: string;
    color: string | null;
}

interface TagSelectorProps {
    documentId: string;
    teamId: string;
    onTagsChange?: (tags: Tag[]) => void;
}

export function TagSelector({
    documentId,
    teamId,
    onTagsChange,
}: TagSelectorProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDocumentTags();
        fetchAvailableTags();
    }, [documentId, teamId]);

    const fetchDocumentTags = async () => {
        try {
            const response = await fetch(`/api/documents/${documentId}/tags`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch tags");
            }

            setSelectedTags(data.tags || []);
            onTagsChange?.(data.tags || []);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const fetchAvailableTags = async () => {
        setLoading(true);

        try {
            const response = await fetch(`/api/teams/${teamId}/tags`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch available tags");
            }

            setAvailableTags(data.tags || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTag = async (tag: Tag) => {
        setError("");

        if (selectedTags.some((t) => t.id === tag.id)) {
            return;
        }

        try {
            const response = await fetch(`/api/documents/${documentId}/tags`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tagId: tag.id }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to add tag");
            }

            const updated = [...selectedTags, tag];
            setSelectedTags(updated);
            onTagsChange?.(updated);
            setOpen(false);
            setSearch("");
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleRemoveTag = async (tagId: string) => {
        setError("");

        try {
            const response = await fetch(
                `/api/documents/${documentId}/tags/${tagId}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to remove tag");
            }

            const updated = selectedTags.filter((t) => t.id !== tagId);
            setSelectedTags(updated);
            onTagsChange?.(updated);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleCreateTag = async () => {
        if (!search.trim()) return;

        setError("");

        try {
            const createResponse = await fetch(`/api/teams/${teamId}/tags`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: search.trim(), color: "#3b82f6" }),
            });

            const createData = await createResponse.json();

            if (!createResponse.ok) {
                throw new Error(createData.error || "Failed to create tag");
            }

            const newTag = createData.tag;
            setAvailableTags([...availableTags, newTag]);
            await handleAddTag(newTag);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const filteredTags = availableTags.filter((tag) =>
        tag.name.toLowerCase().includes(search.toLowerCase())
    );

    const unselectedTags = filteredTags.filter(
        (tag) => !selectedTags.some((t) => t.id === tag.id)
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tags</span>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                    <Badge
                        key={tag.id}
                        variant="secondary"
                        className="pl-2 pr-1 py-1 flex items-center gap-1"
                        style={{
                            backgroundColor: tag.color ? `${tag.color}20` : undefined,
                            borderColor: tag.color || undefined,
                        }}
                    >
                        {tag.color && (
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: tag.color }}
                            />
                        )}
                        <span>{tag.name}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => handleRemoveTag(tag.id)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                ))}

                {!open ? (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 border-dashed"
                        onClick={() => setOpen(true)}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                            <Plus className="h-3 w-3 mr-1" />
                        )}
                        Add Tag
                    </Button>
                ) : (
                    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
                        <div
                            className="fixed inset-0 bg-black/50"
                            onClick={() => setOpen(false)}
                        />
                        <div className="relative w-[300px] bg-background border rounded-lg shadow-lg p-3 space-y-2 z-50">
                            <Input
                                placeholder="Search or create tag..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-9"
                                autoFocus
                            />

                            {unselectedTags.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        No tags found
                                    </p>
                                    {search && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleCreateTag}
                                        >
                                            <Plus className="h-3 w-3 mr-2" />
                                            Create "{search}"
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="max-h-[200px] overflow-y-auto space-y-1">
                                    {unselectedTags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            onClick={() => handleAddTag(tag)}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                                        >
                                            {tag.color && (
                                                <div
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: tag.color }}
                                                />
                                            )}
                                            <span className="flex-1 text-left">{tag.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {selectedTags.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground">
                    No tags applied. Click "Add Tag" to organize this document.
                </p>
            )}
        </div>
    );
}
