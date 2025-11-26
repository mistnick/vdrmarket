/**
 * Custom hook for handling authenticated API fetches
 * Handles 401 errors by clearing cookies and redirecting to login
 */

import { useCallback } from "react";
import { useRouter } from "next/navigation";

interface FetchOptions extends RequestInit {
  /**
   * If true, don't redirect on 401 error
   */
  skipAuthRedirect?: boolean;
}

interface AuthFetchResult<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Clear all auth cookies and redirect to login
 */
async function handleAuthError(): Promise<void> {
  try {
    // Call the API to clear cookies server-side
    await fetch("/api/auth/clear-cookies", { method: "POST" });
  } catch {
    // Ignore errors
  }
  
  // Clear any client-side cookies
  const cookiesToClear = [
    "authjs.session-token",
    "authjs.callback-url",
    "authjs.csrf-token",
    "dataroom-session",
  ];
  
  for (const name of cookiesToClear) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
  
  // Redirect to login
  window.location.href = "/auth/login";
}

/**
 * Hook for making authenticated API requests
 * Automatically handles 401 errors by clearing cookies and redirecting
 */
export function useAuthFetch() {
  const router = useRouter();

  const authFetch = useCallback(async <T>(
    url: string,
    options: FetchOptions = {}
  ): Promise<AuthFetchResult<T>> => {
    const { skipAuthRedirect, ...fetchOptions } = options;
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        credentials: "include",
      });

      if (response.status === 401 && !skipAuthRedirect) {
        await handleAuthError();
        return { data: null, error: "Unauthorized", status: 401 };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          data: null,
          error: errorData.error || `Request failed with status ${response.status}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return { data, error: null, status: response.status };
    } catch (error) {
      console.error("Fetch error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Network error",
        status: 0,
      };
    }
  }, [router]);

  return { authFetch, handleAuthError };
}

/**
 * Simple fetch wrapper that handles 401 errors
 * Use this for one-off fetches outside of React components
 */
export async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; ok: boolean }> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
    });

    if (response.status === 401) {
      await handleAuthError();
      return { data: null, error: "Unauthorized", ok: false };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: errorData.error || `Request failed`,
        ok: false,
      };
    }

    const data = await response.json();
    return { data, error: null, ok: true };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Network error",
      ok: false,
    };
  }
}
