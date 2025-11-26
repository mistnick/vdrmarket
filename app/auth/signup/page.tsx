"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Loader2, User, Mail, Lock, AlertCircle } from "lucide-react"

export default function SignupPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const name = formData.get("name") as string

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, name }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Registration failed")
            }

            router.push("/auth/login?message=Account created! Please sign in.")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 mb-4">
                        <FileText className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900">DataRoom</h1>
                    <p className="text-sm text-gray-500 mt-1">Create your account</p>
                </div>

                {/* Signup Card */}
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-semibold">Get Started</CardTitle>
                        <CardDescription className="text-gray-500">
                            Create your account to start managing documents
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {error && (
                            <Alert variant="destructive" className="mb-5 border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSignup} className="space-y-5">
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
                                        className="pl-10 border-gray-200 focus-visible:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="you@company.com"
                                        required
                                        disabled={isLoading}
                                        className="pl-10 border-gray-200 focus-visible:ring-emerald-500"
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
                                        className="pl-10 border-gray-200 focus-visible:ring-emerald-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Must be at least 8 characters long
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </Button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator className="w-full" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-3 text-gray-500 font-medium">
                                        or continue with
                                    </span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                disabled={isLoading}
                                className="w-full h-11 border-gray-200 text-gray-700 hover:bg-gray-50"
                            >
                                Sign up with Authentik
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{" "}
                                <Link
                                    href="/auth/login"
                                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 mt-8">
                    By creating an account, you agree to our{" "}
                    <Link href="/terms" className="text-emerald-600 hover:text-emerald-700">
                        Terms of Service
                    </Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700">
                        Privacy Policy
                    </Link>
                </p>
            </div>
        </div>
    )
}
