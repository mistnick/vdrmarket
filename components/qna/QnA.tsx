// components/qna/QnA.tsx
"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QnA() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Q&A System</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Placeholder for Q&A UI. Implement question list, answer form, and filters here.</p>
            </CardContent>
        </Card>
    );
}
