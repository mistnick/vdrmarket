"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, FileText, Download, Eye, Clock, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PublicLinkViewerPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [documentData, setDocumentData] = useState<any>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

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
      <div
        className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4"
        onContextMenu={(e) => hasScreenshotProtection && e.preventDefault()}
        onDragStart={(e) => hasScreenshotProtection && e.preventDefault()}
        onCopy={(e) => hasScreenshotProtection && e.preventDefault()}
        style={{
          userSelect: hasScreenshotProtection ? 'none' : 'auto',
          WebkitUserSelect: hasScreenshotProtection ? 'none' : 'auto',
        }}
      >
        {/* Watermark Overlay */}
        {hasWatermark && (
          <div
            className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
            style={{ mixBlendMode: 'multiply' }}
          >
            <div className="relative w-full h-full">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute text-gray-400/20 text-sm font-mono transform -rotate-45 whitespace-nowrap"
                  style={{
                    top: `${(i * 80) % 100}%`,
                    left: `${(i * 120) % 100}%`,
                    fontSize: '14px',
                    letterSpacing: '2px',
                  }}
                >
                  {email || 'CONFIDENTIAL'} • {new Date().toLocaleDateString()}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto relative z-10">{/* Document Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{documentData.documentName}</CardTitle>
                  <CardDescription className="mt-1">
                    Shared via DataRoom{hasWatermark && ' • Watermarked'}
                  </CardDescription>
                </div>
                {documentData.allowDownload && (
                  <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Document Viewer */}
          <Card>
            <CardContent className="p-8">
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Document Viewer</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Document preview will be displayed here
                </p>
                <p className="text-xs text-muted-foreground">
                  Document ID: {documentData.documentId}
                </p>
                {hasScreenshotProtection && (
                  <Alert className="mt-4 max-w-md mx-auto">
                    <Shield className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      This document is protected. Screenshots and copying are disabled.
                    </AlertDescription>
                  </Alert>
                )}
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
