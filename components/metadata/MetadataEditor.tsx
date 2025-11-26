// components/metadata/MetadataEditor.tsx
"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function MetadataEditor() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Metadata Editor</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Placeholder for metadata editing UI. Implement fields, save logic, and validation here.</p>
            </CardContent>
        </Card>
    );
}
