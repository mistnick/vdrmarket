/**
 * Link Access Validation
 * 
 * Validates link access based on security controls:
 * - Expiration check
 * - Max views limit
 * - Email domain restrictions
 * - Active status
 */

import { Link, LinkAllowedEmail } from '@prisma/client';

export interface LinkAccessValidation {
    allowed: boolean;
    error?: string;
    errorCode?: 'EXPIRED' | 'MAX_VIEWS_EXCEEDED' | 'DOMAIN_NOT_ALLOWED' | 'INACTIVE' | 'INVALID_EMAIL';
}

export interface LinkWithAllowedEmails extends Link {
    allowedEmails?: LinkAllowedEmail[];
}

/**
 * Validate if a link can be accessed
 * 
 * @param link - The link to validate
 * @param viewerEmail - Email of the person trying to access (optional)
 * @returns Validation result
 */
export function validateLinkAccess(
    link: LinkWithAllowedEmails,
    viewerEmail?: string
): LinkAccessValidation {
    // 1. Check if link is active
    if (!link.isActive) {
        return {
            allowed: false,
            error: 'This link has been revoked',
            errorCode: 'INACTIVE',
        };
    }

    // 2. Check if link has expired
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return {
            allowed: false,
            error: 'This link has expired',
            errorCode: 'EXPIRED',
        };
    }

    // 3. Check max views limit
    if (link.maxViews !== null && link.viewCount >= link.maxViews) {
        return {
            allowed: false,
            error: 'This link has reached its maximum view limit',
            errorCode: 'MAX_VIEWS_EXCEEDED',
        };
    }

    // 4. Check email domain restrictions (only if viewer email is provided)
    if (viewerEmail && link.allowedDomains) {
        const isValidDomain = validateEmailDomain(viewerEmail, link.allowedDomains as string[]);
        if (!isValidDomain) {
            return {
                allowed: false,
                error: 'Your email domain is not authorized to view this document',
                errorCode: 'DOMAIN_NOT_ALLOWED',
            };
        }
    }

    // 5. Check if email is in allowed list (if email protection is enabled)
    if (link.emailProtected && viewerEmail && link.allowedEmails) {
        const allowedEmails = link.allowedEmails.map(ae => ae.email.toLowerCase());
        if (!allowedEmails.includes(viewerEmail.toLowerCase())) {
            return {
                allowed: false,
                error: 'Your email is not authorized to view this document',
                errorCode: 'INVALID_EMAIL',
            };
        }
    }

    // All checks passed
    return {
        allowed: true,
    };
}

/**
 * Validate if an email belongs to an allowed domain
 * 
 * @param email - Email to validate
 * @param allowedDomains - Array of allowed domains (e.g. ["company.com", "partner.com"])
 * @returns True if email domain is allowed
 */
export function validateEmailDomain(email: string, allowedDomains: string[]): boolean {
    if (!allowedDomains || allowedDomains.length === 0) {
        return true; // No restrictions
    }

    // Extract domain from email
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain) {
        return false;
    }

    // Check if domain matches any allowed domain
    return allowedDomains.some(domain => {
        const normalizedDomain = domain.toLowerCase().trim();
        return emailDomain === normalizedDomain;
    });
}

/**
 * Calculate time until link expires
 * 
 * @param expiresAt - Expiration date
 * @returns Human-readable time until expiration
 */
export function getTimeUntilExpiry(expiresAt: Date | null): string | null {
    if (!expiresAt) {
        return null;
    }

    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs < 0) {
        return 'Expired';
    }

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
}

/**
 * Calculate views remaining for a link
 * 
 * @param link - The link to check
 * @returns Number of views remaining, or null if unlimited
 */
export function getViewsRemaining(link: Link): number | null {
    if (link.maxViews === null) {
        return null; // Unlimited
    }

    const remaining = link.maxViews - link.viewCount;
    return Math.max(0, remaining);
}
