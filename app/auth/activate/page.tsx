"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Loader2, User, Lock, AlertCircle, CheckCircle2 } from "lucide-react"

function ActivateForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams?.get("token") ?? null
    
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [tokenError, setTokenError] = useState(false)

    useEffect(() => {
        if (!token) {
            setTokenError(true)
        }
    }, [token])

    async function handleActivate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const name = formData.get("name") as string
        const password = formData.get("password") as string
        const confirmPassword = formData.get("confirmPassword") as string

        // Validate passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match")
            setIsLoading(false)
            return
        }

        // Validate password length
        if (password.length < 8) {
            setError("Password must be at least 8 characters long")
            setIsLoading(false)
            return
        }

        try {
            const res = await fetch("/api/vdr/users/activate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, name, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Activation failed")
            }

            setSuccess(true)
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push("/auth/login?message=Account activated! Please sign in.")
            }, 2000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (tokenError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 mb-4">
                            <FileText className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900">SimpleVDR</h1>
                    </div>

                    <Card className="border-gray-200 shadow-sm">
                        <CardContent className="pt-6">
                            <Alert variant="destructive" className="border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Invalid or missing activation token. Please use the link from your invitation email.
                                </AlertDescription>
                            </Alert>
                            <div className="mt-6 text-center">
                                <Link href="/auth/login">
                                    <Button variant="outline" className="border-gray-200">
                                        Go to Login
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 mb-4">
                            <FileText className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900">SimpleVDR</h1>
                    </div>

                    <Card className="border-gray-200 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Activated!</h2>
                                <p className="text-gray-500 mb-4">
                                    Your account has been successfully activated. Redirecting to login...
                                </p>
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 mb-4">
                        <FileText className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900">SimpleVDR</h1>
                    <p className="text-sm text-gray-500 mt-1">Activate your account</p>
                </div>

                {/* Activate Card */}
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-semibold">Complete Your Registration</CardTitle>
                        <CardDescription className="text-gray-500">
                            Set up your name and password to activate your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {error && (
                            <Alert variant="destructive" className="mb-5 border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleActivate} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                    Full Name
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="John Doe"
                                        required
                                        disabled={isLoading}
                                        className="pl-10 border-gray-200 focus-visible:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="Minimum 8 characters"
                                        minLength={8}
                                        required
                                        disabled={isLoading}
                                        className="pl-10 border-gray-200 focus-visible:ring-blue-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Must be at least 8 characters long
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                                    Confirm Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="Confirm your password"
                                        minLength={8}
                                        required
                                        disabled={isLoading}
                                        className="pl-10 border-gray-200 focus-visible:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Activating account...
                                    </>
                                ) : (
                                    "Activate Account"
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{" "}
                                <Link
                                    href="/auth/login"
                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 mt-8">
                    By activating your account, you agree to our{" "}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                        Terms of Service
                    </Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                        Privacy Policy
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function ActivatePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 flex items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        }>
            <ActivateForm />
        </Suspense>
    )
}
