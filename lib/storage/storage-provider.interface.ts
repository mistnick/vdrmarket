/**
 * Storage Provider Interface
 * Abstract interface for different storage providers (S3, Azure Blob, etc.)
 */

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface DownloadOptions {
  expiresIn?: number; // seconds
}

export interface StorageFile {
  key: string;
  url: string;
  size: number;
  contentType?: string;
}

export interface IStorageProvider {
  /**
   * Upload a file to storage
   */
  upload(
    key: string,
    file: Buffer | ReadableStream,
    options?: UploadOptions
  ): Promise<StorageFile>;

  /**
   * Download a file from storage
   */
  download(key: string): Promise<Buffer>;

  /**
   * Get a signed URL for temporary access
   */
  getSignedUrl(key: string, options?: DownloadOptions): Promise<string>;

  /**
   * Delete a file from storage
   */
  delete(key: string): Promise<void>;

  /**
   * Delete multiple files from storage
   */
  deleteMany(keys: string[]): Promise<void>;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get file metadata
   */
  getMetadata(key: string): Promise<{
    size: number;
    contentType?: string;
    lastModified?: Date;
    metadata?: Record<string, string>;
  }>;

  /**
   * List files with a prefix
   */
  list(prefix: string): Promise<StorageFile[]>;
}
