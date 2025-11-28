"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, FileText, Download, Eye, Clock, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EnhancedSecureViewer } from "@/components/viewer/enhanced-secure-viewer";
import { SecurityViolationType } from "@/hooks/use-security-protection";

export default function PublicLinkViewerPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [documentData, setDocumentData] = useState<any>(null);
  const [viewerIpAddress, setViewerIpAddress] = useState<string | undefined>(undefined);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  // Fetch viewer's IP address
  useEffect(() => {
    fetch("/api/auth/ip")
      .then((res) => res.json())
      .then((data) => setViewerIpAddress(data.ip))
      .catch(() => setViewerIpAddress(undefined));
  }, []);

  // Handle security violations
  const handleSecurityViolation = useCallback(
    (type: SecurityViolationType, count: number) => {
      // Log security violations to analytics
      console.warn(`[Security] Violation detected: ${type} (count: ${count})`);
      
      // Optionally send to server for logging
      if (slug && email) {
        fetch(`/api/public/${slug}/security-event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            count,
            viewerEmail: email,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {
          // Silently fail - security logging is best-effort
        });
      }
    },
    [slug, email]
  );

  useEffect(() => {
    fetchLinkData();
  }, [slug]);

  const fetchLinkData = async () => {
    try {
      const response = await fetch(`/api/public/${slug}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError("Link not found");
        } else if (response.status === 410) {
          setError("This link has expired");
        } else {
          setError(data.error || "Failed to load link");
        }
        return;
      }

      setLink(data.data);
    } catch (err: any) {
      setError("An error occurred while loading the link");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);

    try {
      const response = await fetch(`/api/public/${slug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email || undefined,
          name: name || undefined,
          password: password || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Access denied");
      }

      setDocumentData(data.data);
      setVerified(true);
    } catch (err: any) {
      setError(err.message || "Failed to verify access");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !link) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              {error.includes("expired") ? (
                <Clock className="w-8 h-8 text-red-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600" />
              )}
            </div>
            <CardTitle>
              {error.includes("expired") ? "Link Expired" : "Error"}
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!link) {
    return null;
  }

  const hasPassword = link.hasPassword;
  const requiresEmail = link.emailProtected || link.emailAuthenticated;

  // If verified, show document viewer
  if (verified && documentData) {
    const hasWatermark = link.enableWatermark;
    const hasScreenshotProtection = link.enableScreenshotProtection;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Document Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{documentData.documentName}</h1>
              <p className="text-sm text-gray-500">
                Shared via DataRoom
                {hasWatermark && ' • Watermarked'}
                {hasScreenshotProtection && ' • Protected'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Shield className="h-4 w-4 text-green-500" />
              <span>Secure Viewing</span>
            </div>
          </div>
        </div>

        {/* Enhanced Secure Viewer */}
        <div className="h-[calc(100vh-64px)]">
          <EnhancedSecureViewer
            documentUrl={documentData.url}
            documentName={documentData.documentName}
            fileType={documentData.fileType}
            userName={name || email || "Viewer"}
            userEmail={email || "anonymous"}
            ipAddress={viewerIpAddress || documentData.ipAddress}
            allowDownload={documentData.allowDownload}
            allowPrint={false}
            allowCopy={false}
            enableWatermark={hasWatermark}
            enableScreenshotProtection={hasScreenshotProtection}
            watermarkOpacity={0.12}
            onSecurityViolation={handleSecurityViolation}
          />
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 text-white text-center py-2 text-xs z-50">
          Powered by <span className="font-semibold">DataRoom</span> • Secure Document Sharing
        </div>
      </div>
    );
  }

  // Show access verification form
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-1">
                  {link.name || link.document.name}
                </CardTitle>
                <CardDescription className="text-base">
                  {link.description || `Shared by ${link.document.team.name}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Access Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Secure Access
            </CardTitle>
            <CardDescription>
              {hasPassword && requiresEmail
                ? "Enter your email and password to access this document"
                : hasPassword
                  ? "Enter the password to access this document"
                  : requiresEmail
                    ? "Enter your email to access this document"
                    : "Click below to view the document"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {requiresEmail && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              )}

              {requiresEmail && (
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name (Optional)</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              )}

              {hasPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12"
                size="lg"
                disabled={verifying}
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5 mr-2" />
                    View Document
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{link.document.fileType.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Download className="w-4 h-4" />
                  <span>{link.allowDownload ? "Download allowed" : "View only"}</span>
                </div>
                {link.expiresAt && (
                  <div className="flex items-center gap-2 text-gray-600 col-span-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      Expires: {new Date(link.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Powered by <span className="font-semibold">DataRoom</span>
          </p>
        </div>
      </div>
    </div>
  );
}
