"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Trash2,
    Edit2,
    GripVertical,
    Loader2,
    Folder
} from "lucide-react";

interface QACategory {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    order: number;
}

interface QACategoryManagerProps {
    dataRoomId: string;
}

const PRESET_COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#f59e0b", // amber
    "#10b981", // emerald
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
];

export function QACategoryManager({ dataRoomId }: QACategoryManagerProps) {
    const [categories, setCategories] = useState<QACategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showDialog, setShowDialog] = useState(false);
    const [editingCategory, setEditingCategory] = useState<QACategory | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        color: PRESET_COLORS[0],
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, [dataRoomId]);

    const fetchCategories = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/datarooms/${dataRoomId}/qa-categories`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch categories");
            }

            setCategories(data.categories || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const url = editingCategory
                ? `/api/datarooms/${dataRoomId}/qa-categories/${editingCategory.id}`
                : `/api/datarooms/${dataRoomId}/qa-categories`;

            const method = editingCategory ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to save category");
            }

            await fetchCategories();
            setShowDialog(false);
            resetForm();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (categoryId: string) => {
        if (!confirm("Are you sure you want to delete this category?")) {
            return;
        }

        try {
            const response = await fetch(
                `/api/datarooms/${dataRoomId}/qa-categories/${categoryId}`,
                { method: "DELETE" }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete category");
            }

            await fetchCategories();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleEdit = (category: QACategory) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || "",
            color: category.color || PRESET_COLORS[0],
        });
        setShowDialog(true);
    };

    const resetForm = () => {
        setEditingCategory(null);
        setFormData({
            name: "",
            description: "",
            color: PRESET_COLORS[0],
        });
    };

    const handleOpenDialog = () => {
        resetForm();
        setShowDialog(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Q&A Categories</h3>
                    <p className="text-sm text-muted-foreground">
                        Organize questions into categories for better management
                    </p>
                </div>
                <Button onClick={handleOpenDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12 border rounded-lg border-dashed">
                    <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-medium mb-2">No categories yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Create categories to organize Q&A discussions
                    </p>
                    <Button onClick={handleOpenDialog} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Category
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <GripVertical className="h-5 w-5 text-muted-foreground" />

                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: category.color || "#gray" }}
                            />

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{category.name}</h4>
                                    <Badge variant="secondary" className="text-xs">
                                        {category.order}
                                    </Badge>
                                </div>
                                {category.description && (
                                    <p className="text-sm text-muted-foreground truncate">
                                        {category.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(category)}
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(category.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? "Edit Category" : "Create Category"}
                        </DialogTitle>
                        <DialogDescription>
                            Categorize questions for better organization and routing
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="e.g., Financial, Legal, Technical"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="Optional description..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex gap-2 flex-wrap">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color
                                                ? "border-foreground scale-110"
                                                : "border-transparent"
                                            }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setFormData({ ...formData, color })}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowDialog(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : editingCategory ? (
                                    "Update"
                                ) : (
                                    "Create"
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
