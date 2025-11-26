"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  Trash2,
  AlertTriangle,
  Shield,
  Database,
  FileText,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PrivacySecurityPage() {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleExportData = async () => {
    try {
      setExportLoading(true);
      const response = await fetch("/api/user/export-data");

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dataroom-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to export data");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("An error occurred while exporting data");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE_MY_ACCOUNT") {
      alert("Please type DELETE_MY_ACCOUNT to confirm");
      return;
    }

    if (!deletePassword) {
      alert("Please enter your password");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
          password: deletePassword,
        }),
      });

      if (response.ok) {
        alert("Account deleted successfully. You will be logged out.");
        window.location.href = "/auth/login";
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("An error occurred while deleting account");
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Privacy & Security</h1>
        <p className="text-slate-600 mt-1">
          Manage your data, privacy settings, and account security
        </p>
      </div>

      <Tabs defaultValue="privacy" className="space-y-6">
        <TabsList>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                GDPR Rights
              </CardTitle>
              <CardDescription>
                Your data protection and privacy rights under GDPR
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  You have the right to access, correct, and delete your personal
                  data. We are committed to protecting your privacy and complying
                  with GDPR regulations.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      Right to Access
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Download all your personal data in a machine-readable format
                    </p>
                  </div>
                  <Button
                    onClick={handleExportData}
                    disabled={exportLoading}
                    variant="outline"
                  >
                    {exportLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Export Data
                  </Button>
                </div>

                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      Right to be Forgotten
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-5 w-5" />
                          Delete Account Permanently
                        </DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete
                          your account and remove all your data from our servers.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Warning:</strong> All your documents, links,
                            folders, and data rooms will be permanently deleted.
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                          <Label htmlFor="delete-confirmation">
                            Type <strong>DELETE_MY_ACCOUNT</strong> to confirm
                          </Label>
                          <Input
                            id="delete-confirmation"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="DELETE_MY_ACCOUNT"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="delete-password">
                            Enter your password
                          </Label>
                          <Input
                            id="delete-password"
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Your password"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={loading}
                        >
                          {loading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Delete My Account
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Export & Backup
              </CardTitle>
              <CardDescription>
                Download and backup your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">
                      Complete Data Export
                    </h4>
                    <p className="text-sm text-slate-600 mb-3">
                      Download all your data including:
                    </p>
                    <ul className="text-sm text-slate-600 space-y-1 ml-4">
                      <li className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Profile information
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Documents and folders
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Links and views
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Audit logs and activity
                      </li>
                    </ul>
                  </div>
                  <Button
                    onClick={handleExportData}
                    disabled={exportLoading}
                    size="lg"
                  >
                    {exportLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Export All Data
                  </Button>
                </div>

                <Alert>
                  <AlertDescription>
                    Your data will be exported in JSON format. This file contains
                    all your personal information and should be stored securely.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your account is protected with industry-standard security
                  measures including encrypted passwords and secure sessions.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      Change Password
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Update your password regularly for better security
                    </p>
                  </div>
                  <Button variant="outline">Change Password</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      Two-Factor Authentication
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">Enable 2FA</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                        <DialogDescription>
                          Scan the QR code with your authenticator app to enable 2FA.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        <div className="w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                          <Shield className="h-16 w-16 text-slate-300" />
                          {/* Placeholder for QR Code */}
                        </div>
                        <div className="w-full max-w-sm space-y-2">
                          <Label htmlFor="2fa-code">Verification Code</Label>
                          <Input id="2fa-code" placeholder="Enter 6-digit code" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => alert("2FA Enabled (Mock)")}>
                          Verify & Enable
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      Active Sessions
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      View and manage your active sessions
                    </p>
                  </div>
                  <Button variant="outline">View Sessions</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
