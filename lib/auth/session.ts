/**
 * Session management utilities - Custom Implementation
 * Database-backed session management without NextAuth
 */

import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { User } from "@prisma/client";
import { randomBytes } from "crypto";

const SESSION_COOKIE_NAME = "dataroom-session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionData {
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
}

/**
 * Create a new session for a user
 */
export async function createSession(user: User): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      sessionToken: generateSessionToken(),
      expires: expiresAt,
    },
  });

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return session.sessionToken;
}

/**
 * Get current session data
 */
import { auth } from "@/lib/auth";

// List of auth cookies to clear on JWT errors
// Includes all possible NextAuth cookie name variations
const AUTH_COOKIES_TO_CLEAR = [
  "authjs.session-token",
  "authjs.callback-url",
  "authjs.csrf-token",
  "__Secure-authjs.session-token",
  "__Secure-authjs.callback-url",
  "__Host-authjs.csrf-token",
  "next-auth.session-token",
  "next-auth.callback-url",
  "next-auth.csrf-token",
  "__Secure-next-auth.session-token",
  "__Secure-next-auth.callback-url",
  "__Host-next-auth.csrf-token",
];

/**
 * Check if an error is a JWT-related error that requires cookie cleanup
 */
function isJWTError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as Record<string, unknown>;

  // Check error name
  if (err.name === 'JWTSessionError' || err.name === 'JWEDecryptionFailed') {
    return true;
  }

  // Check error message
  const message = String(err.message || '');
  if (message.includes('decryption') ||
    message.includes('JWTSessionError') ||
    message.includes('no matching')) {
    return true;
  }

  // Check cause
  const cause = err.cause as Record<string, unknown> | undefined;
  if (cause) {
    const causeMessage = String(cause.message || '');
    if (causeMessage.includes('decryption') ||
      causeMessage.includes('no matching')) {
      return true;
    }
  }

  return false;
}

/**
 * Clear all auth-related cookies
 */
async function clearAuthCookies(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const existingCookies = cookieStore.getAll();
    console.warn("[SESSION] Clearing invalid JWT cookies. Existing cookies:",
      existingCookies.map(c => c.name).join(", "));

    let clearedCount = 0;
    for (const name of AUTH_COOKIES_TO_CLEAR) {
      try {
        cookieStore.delete(name);
        clearedCount++;
      } catch (err) {
        // Ignore errors when deleting individual cookies
        console.debug(`[SESSION] Could not delete cookie: ${name}`);
      }
    }

    console.info(`[SESSION] Cleared ${clearedCount} auth cookies due to invalid JWT`);
  } catch (err) {
    console.error("[SESSION] Failed to access cookie store:", err);
  }
}

export async function getSession(): Promise<SessionData | null> {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;

  try {
    cookieStore = await cookies();
  } catch {
    console.error("[SESSION] Unable to access cookies");
    return null;
  }

  try {
    // 1. Try to get custom session from cookie (database-backed)
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });

      if (session && session.expires > new Date()) {
        return {
          userId: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        };
      } else if (session) {
        // Session expired, clean up
        await prisma.session.delete({ where: { sessionToken } }).catch(() => { });
        try {
          cookieStore.delete(SESSION_COOKIE_NAME);
        } catch {
          // Ignore
        }
      }
    }

    // 2. Fallback to NextAuth session
    try {
      const session = await auth();

      if (!session?.user) {
        return null;
      }

      return {
        userId: session.user.id as string,
        email: session.user.email as string,
        name: session.user.name || null,
        image: session.user.image || null,
      };
    } catch (authError: unknown) {
      // Handle JWT decryption errors by clearing auth cookies
      if (isJWTError(authError)) {
        console.warn("[SESSION] Invalid JWT token detected, clearing auth cookies");
        await clearAuthCookies();
      } else {
        console.error("[SESSION] Auth error:", authError);
      }
      return null;
    }
  } catch (error) {
    console.error("[SESSION] Error getting session:", error);
    return null;
  }
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<User | null> {
  const sessionData = await getSession();

  if (!sessionData) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionData.userId },
  });

  return user;
}

/**
 * Delete current session (logout)
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await prisma.session.delete({
      where: { sessionToken },
    }).catch(() => {
      // Session might not exist, that's ok
    });

    // Delete custom session cookie
    try {
      cookieStore.delete(SESSION_COOKIE_NAME);
    } catch {
      // Ignore
    }
  }

  // Also clear all NextAuth cookies to ensure complete logout
  // Try multiple deletion strategies to ensure cookies are cleared
  for (const cookieName of AUTH_COOKIES_TO_CLEAR) {
    try {
      // Try deleting with various options
      cookieStore.delete(cookieName);

      // Also try with explicit options
      cookieStore.set(cookieName, "", {
        maxAge: 0,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    } catch (err) {
      // Ignore errors, cookie might not exist
      console.debug(`[SESSION] Could not delete cookie: ${cookieName}`);
    }
  }

  console.log("[SESSION] All session cookies cleared");
}

/**
 * Clear session (alias for deleteSession)
 */
export async function clearSession(): Promise<void> {
  await deleteSession();
}

/**
 * Verify session is valid
 */
export async function verifySession(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  return await verifySession();
}

/**
 * Generate a secure random session token
 */
export function generateSessionToken(): string {
  // Generate 32 random bytes (256 bits) and return as hex string.
  return randomBytes(32).toString("hex");
}



/**
 * Cleanup expired sessions (should be run periodically)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await prisma.session.deleteMany({
    where: {
      expires: {
        lt: new Date(),
      },
    },
  });
}
