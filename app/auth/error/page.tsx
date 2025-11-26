"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  FileText,
  ShieldAlert,
  ServerCrash,
  Lock,
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

type ErrorCode = "400" | "401" | "403" | "404" | "500" | "config" | "csrf" | "provider" | "help" | "default";

interface ErrorInfo {
  title: string;
  description: string;
  icon: React.ReactNode;
  suggestion: string;
}

const errorMessages: Record<ErrorCode, ErrorInfo> = {
  "400": {
    title: "Bad Request",
    description: "The authentication request was malformed or missing required parameters.",
    icon: <AlertCircle className="h-10 w-10 text-orange-500" />,
    suggestion: "Please try signing in again. If the problem persists, contact support.",
  },
  "401": {
    title: "Authentication Required",
    description: "Your session has expired or you need to sign in to access this resource.",
    icon: <Lock className="h-10 w-10 text-blue-500" />,
    suggestion: "Please sign in to continue.",
  },
  "403": {
    title: "Access Denied",
    description: "You don't have permission to access this resource.",
    icon: <ShieldAlert className="h-10 w-10 text-red-500" />,
    suggestion: "If you believe this is an error, contact your administrator.",
  },
  "404": {
    title: "Not Found",
    description: "The requested authentication resource was not found.",
    icon: <AlertCircle className="h-10 w-10 text-gray-500" />,
    suggestion: "Please return to the home page and try again.",
  },
  "500": {
    title: "Service Unavailable",
    description: "The authentication service is temporarily unavailable or experiencing issues.",
    icon: <ServerCrash className="h-10 w-10 text-red-600" />,
    suggestion: "Please try again in a few moments. If the problem persists, contact support.",
  },
  "config": {
    title: "Configuration Error",
    description: "The OAuth2/OIDC authentication is not properly configured.",
    icon: <ShieldAlert className="h-10 w-10 text-yellow-600" />,
    suggestion: "Contact your system administrator to configure the identity provider.",
  },
  "csrf": {
    title: "Security Verification Failed",
    description: "The authentication request failed security verification (CSRF protection).",
    icon: <ShieldAlert className="h-10 w-10 text-red-600" />,
    suggestion: "This may be due to an expired session. Please try signing in again.",
  },
  "provider": {
    title: "Identity Provider Error",
    description: "The identity provider returned an error during authentication.",
    icon: <ServerCrash className="h-10 w-10 text-orange-600" />,
    suggestion: "Please try again. If the problem persists, contact your identity provider administrator.",
  },
  "help": {
    title: "Need Help?",
    description: "If you're having trouble signing in, here are some common solutions.",
    icon: <HelpCircle className="h-10 w-10 text-blue-600" />,
    suggestion: "Check that your organization's identity provider is accessible and that you have an active account.",
  },
  "default": {
    title: "Authentication Error",
    description: "An unexpected error occurred during authentication.",
    icon: <AlertCircle className="h-10 w-10 text-gray-600" />,
    suggestion: "Please try signing in again. If the problem persists, contact support.",
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const code = (searchParams?.get("code") || "default") as ErrorCode;
  const detail = searchParams?.get("detail");
  const error = errorMessages[code] || errorMessages["default"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Logo e Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="rounded-xl bg-blue-600 p-3 shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            DataRoom
          </h1>
        </div>

        {/* Card di Errore */}
        <Card className="shadow-xl border-slate-200">
          <CardHeader className="text-center space-y-4 pb-4">
            <div className="flex justify-center">{error.icon}</div>
            <div className="space-y-2">
              <CardTitle className="text-2xl">{error.title}</CardTitle>
              <CardDescription className="text-base">
                {error.description}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dettagli errore (se disponibili) */}
            {detail && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription className="font-mono text-sm">
                  {detail}
                </AlertDescription>
              </Alert>
            )}

            {/* Suggerimento */}
            <Alert className="bg-blue-50 border-blue-200">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">What to do next</AlertTitle>
              <AlertDescription className="text-blue-800">
                {error.suggestion}
              </AlertDescription>
            </Alert>

            {/* Azioni */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700">
                <Link href="/auth/login">
                  Back to Sign In
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 h-12 text-base">
                <Link href="/">
                  Go to Home
                </Link>
              </Button>
            </div>

            {/* Help section per code=help */}
            {code === "help" && (
              <div className="pt-6 border-t border-slate-200 space-y-4">
                <h3 className="font-semibold text-slate-900">Common Issues:</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
                  <li>Ensure your browser allows cookies and doesn't block third-party authentication</li>
                  <li>Check that your organization's identity provider is accessible</li>
                  <li>Verify that your account is active and not locked</li>
                  <li>Try using a different browser or clearing your cache</li>
                  <li>Contact your IT administrator if you continue experiencing issues</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer con supporto */}
        <div className="text-center">
          <p className="text-sm text-slate-600">
            Need additional help?{" "}
            <a href="mailto:support@dataroom.com" className="text-blue-600 hover:underline font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
