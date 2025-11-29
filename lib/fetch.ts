/**
 * Authenticated fetch wrapper
 * Automatically includes credentials for all requests
 */

type FetchInput = RequestInfo | URL;

interface AuthFetchInit extends RequestInit {
  /**
   * Skip adding credentials (default: false)
   */
  skipCredentials?: boolean;
}

/**
 * Fetch wrapper that automatically includes credentials
 * Use this instead of native fetch for API calls that require authentication
 * 
 * @example
 * // Simple GET request
 * const response = await authFetch('/api/documents');
 * 
 * // POST request with body
 * const response = await authFetch('/api/documents', {
 *   method: 'POST',
 *   body: formData,
 * });
 * 
 * // DELETE request
 * const response = await authFetch('/api/documents/123', {
 *   method: 'DELETE',
 * });
 */
export async function authFetch(
  input: FetchInput,
  init?: AuthFetchInit
): Promise<Response> {
  const { skipCredentials, ...fetchInit } = init || {};

  return fetch(input, {
    ...fetchInit,
    credentials: skipCredentials ? fetchInit.credentials : "include",
  });
}

/**
 * JSON fetch wrapper that automatically:
 * - Includes credentials
 * - Sets Content-Type to application/json
 * - Stringifies body if it's an object
 * - Parses JSON response
 * 
 * @example
 * const { data, error } = await jsonFetch('/api/documents', {
 *   method: 'POST',
 *   body: { name: 'test' },
 * });
 */
export async function jsonFetch<T = unknown>(
  input: FetchInput,
  init?: AuthFetchInit & { body?: unknown }
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const { body, ...restInit } = init || {};

    const response = await authFetch(input, {
      ...restInit,
      headers: {
        "Content-Type": "application/json",
        ...restInit.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        error: responseData?.error || `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    return {
      data: responseData as T,
      error: null,
      status: response.status,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Network error",
      status: 0,
    };
  }
}
