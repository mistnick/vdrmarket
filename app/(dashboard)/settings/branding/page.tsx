"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, Palette, Globe, Droplet, Check, AlertTriangle } from "lucide-react";

export default function BrandingSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    logo: "",
    brandColor: "#2563eb",
    accentColor: "#0ea5e9",
    customDomain: "",
    watermarkEnabled: true,
    watermarkText: "",
    watermarkOpacity: 0.3,
  });

  useEffect(() => {
    fetchTeamSettings();
  }, []);

  const fetchTeamSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/teams/current", {
        credentials: "include"
      });
      if (response.ok) {
        const team = await response.json();
        setFormData({
          logo: team.logo || "",
          brandColor: team.brandColor || "#2563eb",
          accentColor: team.accentColor || "#0ea5e9",
          customDomain: team.customDomain || "",
          watermarkEnabled: team.watermarkEnabled ?? true,
          watermarkText: team.watermarkText || "",
          watermarkOpacity: team.watermarkOpacity || 0.3,
        });
      }
    } catch (err) {
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB");
      return;
    }

    try {
      setUploadingLogo(true);
      setError(null);

      const formDataObj = new FormData();
      formDataObj.append("logo", file);

      const response = await fetch("/api/teams/branding/logo", {
        method: "POST",
        credentials: "include",
        body: formDataObj,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, logo: data.logoUrl }));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to upload logo");
      }
    } catch (err) {
      setError("An error occurred while uploading");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch("/api/teams/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save settings");
      }
    } catch (err) {
      setError("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Branding</h1>
        <p className="text-slate-600 mt-1">
          Customize your team's branding and appearance
        </p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Team Logo
          </CardTitle>
          <CardDescription>
            Upload your team logo (max 2MB, PNG or JPG recommended)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {formData.logo && (
              <div className="flex-shrink-0">
                <img
                  src={formData.logo}
                  alt="Team logo"
                  className="h-20 w-20 object-contain rounded-lg border border-slate-200"
                />
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
                disabled={uploadingLogo}
                className="text-sm"
              />
              {uploadingLogo && (
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand Colors
          </CardTitle>
          <CardDescription>
            Choose your primary and accent colors for links and documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brandColor">Primary Color</Label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  id="brandColor"
                  type="color"
                  value={formData.brandColor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, brandColor: e.target.value }))
                  }
                  className="h-10 w-20 cursor-pointer rounded border border-slate-300"
                />
                <Input
                  value={formData.brandColor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, brandColor: e.target.value }))
                  }
                  className="flex-1"
                  placeholder="#2563eb"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  id="accentColor"
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, accentColor: e.target.value }))
                  }
                  className="h-10 w-20 cursor-pointer rounded border border-slate-300"
                />
                <Input
                  value={formData.accentColor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, accentColor: e.target.value }))
                  }
                  className="flex-1"
                  placeholder="#0ea5e9"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
            <div
              className="h-12 w-12 rounded"
              style={{ backgroundColor: formData.brandColor }}
            />
            <div
              className="h-12 w-12 rounded"
              style={{ backgroundColor: formData.accentColor }}
            />
            <div className="text-sm text-slate-600">
              Preview of your brand colors
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Custom Domain
          </CardTitle>
          <CardDescription>
            Use your own domain for sharing links (e.g., share.yourcompany.com)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="customDomain">Custom Domain</Label>
            <Input
              id="customDomain"
              value={formData.customDomain}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, customDomain: e.target.value }))
              }
              placeholder="share.yourcompany.com"
              className="mt-2"
            />
            <p className="text-sm text-slate-500 mt-2">
              Configure DNS CNAME record pointing to our domain
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Watermark Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5" />
            Document Watermarks
          </CardTitle>
          <CardDescription>
            Configure watermarks for PDF documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Watermarks</Label>
              <p className="text-sm text-slate-500 mt-1">
                Add viewer email/name to shared PDFs
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.watermarkEnabled}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, watermarkEnabled: e.target.checked }))
              }
              className="h-5 w-5"
            />
          </div>

          {formData.watermarkEnabled && (
            <>
              <div>
                <Label htmlFor="watermarkText">Custom Watermark Text (Optional)</Label>
                <Input
                  id="watermarkText"
                  value={formData.watermarkText}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, watermarkText: e.target.value }))
                  }
                  placeholder="Leave empty for default format"
                  className="mt-2"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Default: {"{email}"} • {"{name}"} • {"{date}"}
                </p>
              </div>

              <div>
                <Label htmlFor="watermarkOpacity">Opacity: {formData.watermarkOpacity}</Label>
                <input
                  id="watermarkOpacity"
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.1"
                  value={formData.watermarkOpacity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      watermarkOpacity: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full mt-2"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Branding Settings"
          )}
        </Button>
      </div>
    </div>
  );
}
