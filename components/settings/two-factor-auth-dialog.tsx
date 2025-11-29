"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Copy, Check } from "lucide-react";
import Image from "next/image";

interface TwoFactorAuthDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function TwoFactorAuthDialog({
    open,
    onOpenChange,
    onSuccess,
}: TwoFactorAuthDialogProps) {
    const [step, setStep] = useState<"setup" | "verify" | "codes">("setup");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [secret, setSecret] = useState("");
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [verificationCode, setVerificationCode] = useState("");
    const [copied, setCopied] = useState(false);

    const handleEnable2FA = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/2fa/enable", {
                method: "POST",
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to enable 2FA");
            }

            setQrCode(data.qrCode);
            setSecret(data.secret);
            setRecoveryCodes(data.recoveryCodes);
            setStep("verify");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            setError("Please enter a valid 6-digit code");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/2fa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ code: verificationCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Invalid code");
            }

            setStep("codes");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        onOpenChange(false);
        onSuccess?.();
        // Reset state
        setTimeout(() => {
            setStep("setup");
            setQrCode("");
            setSecret("");
            setRecoveryCodes([]);
            setVerificationCode("");
        }, 300);
    };

    const copyRecoveryCodes = () => {
        navigator.clipboard.writeText(recoveryCodes.join("\n"));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                {step === "setup" && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-success" />
                                Enable Two-Factor Authentication
                            </DialogTitle>
                            <DialogDescription>
                                Add an extra layer of security to your account by requiring a
                                verification code from your authenticator app.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="rounded-lg border p-4 space-y-3">
                                <h4 className="font-medium text-sm">How it works:</h4>
                                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                                    <li>Scan QR code with your authenticator app</li>
                                    <li>Enter the 6-digit code to verify</li>
                                    <li>Save your recovery codes in a safe place</li>
                                </ol>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleEnable2FA}
                                disabled={loading}
                                className="bg-success hover:bg-success/90 text-success-foreground"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Continue
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {step === "verify" && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Scan QR Code</DialogTitle>
                            <DialogDescription>
                                Scan this QR code with your authenticator app (Google
                                Authenticator, Authy, 1Password, etc.)
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {qrCode && (
                                <div className="flex justify-center p-4 bg-white rounded-lg border">
                                    <Image
                                        src={qrCode}
                                        alt="2FA QR Code"
                                        width={200}
                                        height={200}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="secret">Or enter this code manually:</Label>
                                <Input
                                    id="secret"
                                    value={secret}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="code">Enter 6-digit code from app:</Label>
                                <Input
                                    id="code"
                                    placeholder="000000"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    maxLength={6}
                                    className="text-center text-2xl font-mono tracking-widest"
                                />
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setStep("setup");
                                    setError("");
                                }}
                                disabled={loading}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleVerify}
                                disabled={loading || verificationCode.length !== 6}
                                className="bg-success hover:bg-success/90 text-success-foreground"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify & Enable
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {step === "codes" && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-success">
                                2FA Enabled Successfully!
                            </DialogTitle>
                            <DialogDescription>
                                Save these recovery codes in a safe place. You can use them to
                                access your account if you lose your authenticator device.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <Alert>
                                <AlertDescription className="font-medium">
                                    ⚠️ These codes will only be shown once. Make sure to save
                                    them now!
                                </AlertDescription>
                            </Alert>

                            <div className="relative">
                                <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                                    {recoveryCodes.map((code, index) => (
                                        <div key={index} className="text-center py-1">
                                            {code}
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={copyRecoveryCodes}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="mr-2 h-3 w-3" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="mr-2 h-3 w-3" />
                                            Copy All
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                onClick={handleFinish}
                                className="w-full bg-success hover:bg-success/90 text-success-foreground"
                            >
                                I've Saved My Recovery Codes
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
