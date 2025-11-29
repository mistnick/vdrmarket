"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Plus,
    Trash2,
    Save,
    Loader2,
    Database,
} from "lucide-react";

interface MetadataField {
    key: string;
    value: string;
    type: string;
}

interface MetadataEditorProps {
    documentId: string;
}

const FIELD_TYPES = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "boolean", label: "Boolean" },
];

export function MetadataEditor({ documentId }: MetadataEditorProps) {
    const [metadata, setMetadata] = useState<MetadataField[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchMetadata();
    }, [documentId]);

    const fetchMetadata = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/documents/${documentId}/metadata`, {
                credentials: "include"
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch metadata");
            }

            setMetadata(data.metadata || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");

        try {
            const response = await fetch(`/api/documents/${documentId}/metadata`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ metadata }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to save metadata");
            }

            setMetadata(data.metadata || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const addField = () => {
        setMetadata([
            ...metadata,
            { key: "", value: "", type: "text" },
        ]);
    };

    const removeField = (index: number) => {
        setMetadata(metadata.filter((_, i) => i !== index));
    };

    const updateField = (
        index: number,
        field: keyof MetadataField,
        value: string
    ) => {
        const updated = [...metadata];
        updated[index] = { ...updated[index], [field]: value };
        setMetadata(updated);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Document Metadata</h3>
                    <p className="text-sm text-muted-foreground">
                        Add custom fields to organize and categorize this document
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={addField} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                    </Button>
                    <Button onClick={handleSave} disabled={saving} size="sm">
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save
                            </>
                        )}
                    </Button>
                </div>
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
            ) : metadata.length === 0 ? (
                <div className="text-center py-12 border rounded-lg border-dashed">
                    <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-medium mb-2">No metadata fields</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Add custom fields to provide additional information
                    </p>
                    <Button onClick={addField} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Field
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {metadata.map((field, index) => (
                        <div
                            key={index}
                            className="grid grid-cols-12 gap-3 p-3 border rounded-lg items-start"
                        >
                            <div className="col-span-4">
                                <Label className="text-xs mb-1">Field Name</Label>
                                <Input
                                    value={field.key}
                                    onChange={(e) => updateField(index, "key", e.target.value)}
                                    placeholder="e.g., ContractValue"
                                    className="h-9"
                                />
                            </div>

                            <div className="col-span-5">
                                <Label className="text-xs mb-1">Value</Label>
                                {field.type === "boolean" ? (
                                    <Select
                                        value={field.value}
                                        onValueChange={(value) =>
                                            updateField(index, "value", value)
                                        }
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true">True</SelectItem>
                                            <SelectItem value="false">False</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                                        value={field.value}
                                        onChange={(e) =>
                                            updateField(index, "value", e.target.value)
                                        }
                                        placeholder="Enter value..."
                                        className="h-9"
                                    />
                                )}
                            </div>

                            <div className="col-span-2">
                                <Label className="text-xs mb-1">Type</Label>
                                <Select
                                    value={field.type}
                                    onValueChange={(value) => updateField(index, "type", value)}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FIELD_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="col-span-1 flex items-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeField(index)}
                                    className="h-9 w-9 p-0"
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
