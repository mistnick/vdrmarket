/**
 * Secure Token Generation for Share Links
 * 
 * Generates cryptographically secure tokens with 128-bit entropy for share links.
 * Uses nanoid with custom alphabet and length to ensure sufficient randomness.
 */

import { customAlphabet } from 'nanoid';

// Use URL-safe alphabet (no special characters that need encoding)
// 64 characters: a-z, A-Z, 0-9, - and _
const SECURE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

// For 128-bit entropy with 64-character alphabet:
// - Each character provides log2(64) = 6 bits of entropy
// - 128 bits / 6 bits = 21.33, so we need 22 characters minimum
const TOKEN_LENGTH = 22;

// Create nanoid generator with custom alphabet
const generateNanoid = customAlphabet(SECURE_ALPHABET, TOKEN_LENGTH);

/**
 * Generate a cryptographically secure token for share links
 * 
 * @returns A 22-character URL-safe token with 128-bit entropy
 * 
 * @example
 * const token = generateSecureToken();
 * // Returns something like: "V1StGXR8_Z5jdHi6B-myT"
 */
export function generateSecureToken(): string {
    return generateNanoid();
}

/**
 * Validate token format
 * 
 * @param token - The token to validate
 * @returns True if token matches expected format
 */
export function isValidTokenFormat(token: string): boolean {
    // Check length
    if (token.length !== TOKEN_LENGTH) {
        return false;
    }

    // Check characters are from our alphabet
    const validChars = new RegExp(`^[${SECURE_ALPHABET}]+$`);
    return validChars.test(token);
}

/**
 * Calculate approximate entropy of a token
 * 
 * @param token - The token to analyze
 * @returns Estimated entropy in bits
 */
export function calculateTokenEntropy(token: string): number {
    const uniqueChars = new Set(token).size;
    const bitsPerChar = Math.log2(uniqueChars);
    return bitsPerChar * token.length;
}

/**
 * Generate a short token for internal use (not for security-critical operations)
 * 
 * @param length - Length of token (default 10)
 * @returns A short token
 */
export function generateShortToken(length: number = 10): string {
    const generator = customAlphabet(SECURE_ALPHABET, length);
    return generator();
}
