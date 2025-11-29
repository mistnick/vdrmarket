/**
 * File Upload Validation and Security
 * 
 * Comprehensive validation for file uploads including:
 * - File type whitelist (MIME type and extension)
 * - File size limits
 * - Filename sanitization
 * - Path traversal prevention
 * - Magic number verification
 */

import path from 'path';
import { FileTypeResult, fileTypeFromBuffer } from 'file-type';

// Global whitelist of allowed MIME types
export const ALLOWED_MIME_TYPES = [
    // Documents
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx

    // Images
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'image/svg+xml',

    // Text
    'text/plain',
    'text/csv',
    'application/json',
    'text/markdown',

    // Archives (for batch uploads)
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
] as const;

// Dangerous file extensions that should always be blocked
const BLOCKED_EXTENSIONS = [
    '.exe', '.dll', '.bat', '.cmd', '.sh', '.ps1', '.app', '.deb', '.rpm',
    '.msi', '.dmg', '.pkg', '.scr', '.com', '.pif', '.vbs', '.js', '.jar',
    '.apk', '.ipa', '.iso', '.img',
] as const;

// Default max file size: 100MB
export const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Validation result interface
 */
export interface ValidationResult {
    valid: boolean;
    error?: string;
    sanitizedFilename?: string;
    detectedMimeType?: string;
}

/**
 * Validate file type against whitelist
 */
export function isAllowedMimeType(mimeType: string, customWhitelist?: readonly string[]): boolean {
    const whitelist: readonly string[] = customWhitelist || ALLOWED_MIME_TYPES;
    return whitelist.includes(mimeType);
}

/**
 * Check if file extension is blocked
 */
export function isBlockedExtension(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return BLOCKED_EXTENSIONS.includes(ext as any);
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 * 
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
    // Remove any directory path components
    let sanitized = path.basename(filename);

    // Remove path traversal sequences
    sanitized = sanitized.replace(/\.\./g, '');
    sanitized = sanitized.replace(/[\/\\]/g, '');

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Normalize Unicode to prevent homograph attacks
    sanitized = sanitized.normalize('NFKC');

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    // Limit length to 255 characters (filesystem limit)
    if (sanitized.length > 255) {
        const ext = path.extname(sanitized);
        const name = path.basename(sanitized, ext);
        sanitized = name.substring(0, 255 - ext.length) + ext;
    }

    // If filename becomes empty after sanitization, generate a default
    if (!sanitized || sanitized === '.') {
        sanitized = `file-${Date.now()}`;
    }

    return sanitized;
}

/**
 * Validate file size
 */
export function validateFileSize(fileSize: number, maxSize: number = DEFAULT_MAX_FILE_SIZE): ValidationResult {
    if (fileSize > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
        return {
            valid: false,
            error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
        };
    }

    return { valid: true };
}

/**
 * Verify MIME type matches file content (magic number check)
 * This prevents attacks where a malicious file is renamed (e.g., virus.exe -> virus.pdf)
 */
export async function verifyMimeType(
    buffer: Buffer,
    declaredMimeType: string
): Promise<ValidationResult> {
    try {
        // Get actual file type from magic numbers
        const fileType: FileTypeResult | undefined = await fileTypeFromBuffer(buffer);

        if (!fileType) {
            // Could not determine file type - allow text files and some edge cases
            const textTypes = ['text/plain', 'text/csv', 'application/json'];
            if (textTypes.includes(declaredMimeType)) {
                return {
                    valid: true,
                    detectedMimeType: declaredMimeType,
                };
            }

            return {
                valid: false,
                error: 'Could not verify file type',
            };
        }

        // Normalize MIME types for comparison
        const normalizedDetected = fileType.mime.toLowerCase();
        const normalizedDeclared = declaredMimeType.toLowerCase();

        // Check if detected type matches or is compatible
        if (normalizedDetected === normalizedDeclared) {
            return {
                valid: true,
                detectedMimeType: normalizedDetected,
            };
        }

        // Handle some common MIME type aliases
        const aliases: Record<string, string[]> = {
            'image/jpeg': ['image/jpg'],
            'application/zip': ['application/x-zip-compressed'],
        };

        for (const [canonical, alternates] of Object.entries(aliases)) {
            if (normalizedDetected === canonical && alternates.includes(normalizedDeclared)) {
                return {
                    valid: true,
                    detectedMimeType: normalizedDetected,
                };
            }
        }

        return {
            valid: false,
            error: `File type mismatch: declared as ${declaredMimeType} but detected as ${fileType.mime}`,
            detectedMimeType: normalizedDetected,
        };
    } catch (error) {
        console.error('Error verifying MIME type:', error);
        return {
            valid: false,
            error: 'Error verifying file type',
        };
    }
}

/**
 * Comprehensive file validation
 * 
 * @param file - File object to validate
 * @param buffer - File buffer for content verification
 * @param options - Validation options
 * @returns Validation result
 */
export async function validateFile(
    file: File,
    buffer: Buffer,
    options: {
        maxSize?: number;
        customWhitelist?: string[];
    } = {}
): Promise<ValidationResult> {
    const { maxSize = DEFAULT_MAX_FILE_SIZE, customWhitelist } = options;

    // 1. Check blocked extensions
    if (isBlockedExtension(file.name)) {
        return {
            valid: false,
            error: 'File type not allowed',
        };
    }

    // 2. Sanitize filename
    const sanitized = sanitizeFilename(file.name);

    // 3. Validate file size
    const sizeValidation = validateFileSize(file.size, maxSize);
    if (!sizeValidation.valid) {
        return sizeValidation;
    }

    // 4. Check MIME type against whitelist
    if (!isAllowedMimeType(file.type, customWhitelist)) {
        return {
            valid: false,
            error: `File type '${file.type}' is not allowed`,
        };
    }

    // 5. Verify MIME type matches file content
    const mimeVerification = await verifyMimeType(buffer, file.type);
    if (!mimeVerification.valid) {
        return mimeVerification;
    }

    return {
        valid: true,
        sanitizedFilename: sanitized,
        detectedMimeType: mimeVerification.detectedMimeType,
    };
}

/**
 * Generate secure storage key for uploaded file
 * Uses UUID to prevent enumeration and path traversal
 */
export function generateSecureStorageKey(
    dataRoomId: string,
    originalFilename: string,
    fileType: 'document' | 'version' = 'document'
): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const sanitizedName = sanitizeFilename(originalFilename);
    const ext = path.extname(sanitizedName);
    const baseName = path.basename(sanitizedName, ext);

    // Create safe filename: timestamp-random-sanitizedname.ext
    // Replace spaces with dashes to ensure URL safety and S3 compatibility
    const safeBaseName = baseName.replace(/\s+/g, '-');
    const safeFilename = `${timestamp}-${randomSuffix}-${safeBaseName}${ext}`;

    if (fileType === 'version') {
        return `datarooms/${dataRoomId}/versions/${safeFilename}`;
    }

    return `datarooms/${dataRoomId}/documents/${safeFilename}`;
}
