"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";

export default function LogoutPage() {
  useEffect(() => {
    // Redirect automatico verso l'endpoint di logout
    window.location.href = "/api/auth/logout";
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="rounded-xl bg-blue-600 p-3 shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <Card className="shadow-xl border-slate-200">
          <CardHeader>
            <CardTitle className="text-center">Signing Out...</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4 py-6">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-center text-slate-600">
              You are being signed out. Please wait...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
