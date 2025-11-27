"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, LogIn, Home, CheckCircle } from "lucide-react";

type LogoutState = "loading" | "success" | "error";

export default function LogoutPage() {
  const router = useRouter();
  const [state, setState] = useState<LogoutState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const performLogout = async () => {
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });

        if (response.ok) {
          setState("success");
        } else {
          const data = await response.json();
          setErrorMessage(data.error || "Errore durante il logout");
          setState("error");
        }
      } catch (error) {
        console.error("Logout error:", error);
        setErrorMessage("Errore di connessione");
        setState("error");
      }
    };

    performLogout();
  }, []);

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleHome = () => {
    router.push("/");
  };

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
          {state === "loading" && (
            <>
              <CardHeader>
                <CardTitle className="text-center">Disconnessione in corso...</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4 py-6">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="text-center text-slate-600">
                  Stai uscendo dalla sessione. Attendi...
                </p>
              </CardContent>
            </>
          )}

          {state === "success" && (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle>Disconnessione completata</CardTitle>
                <CardDescription>
                  Sei uscito dalla sessione con successo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 py-6">
                <p className="text-center text-slate-600 text-sm">
                  Cosa vuoi fare ora?
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleLogin}
                    className="w-full"
                    size="lg"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Accedi di nuovo
                  </Button>
                  <Button
                    onClick={handleHome}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Torna alla homepage
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {state === "error" && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-destructive">Errore</CardTitle>
                <CardDescription>
                  {errorMessage}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 py-6">
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full"
                    size="lg"
                  >
                    Riprova
                  </Button>
                  <Button
                    onClick={handleHome}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Torna alla homepage
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
