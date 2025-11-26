import { S3StorageProvider } from './s3-storage.provider';
import { AzureBlobStorageProvider } from './azure-blob-storage.provider';
import type {
  IStorageProvider,
  StorageFile,
  UploadOptions,
  DownloadOptions,
} from './storage-provider.interface';

let storageProvider: IStorageProvider | null = null;

/**
 * Get the configured storage provider
 * The provider is determined by the STORAGE_PROVIDER environment variable
 */
export function getStorageProvider(): IStorageProvider {
  if (storageProvider) {
    return storageProvider;
  }

  const provider = process.env.STORAGE_PROVIDER || 's3';

  switch (provider.toLowerCase()) {
    case 's3':
      storageProvider = new S3StorageProvider();
      break;
    case 'azure':
      storageProvider = new AzureBlobStorageProvider();
      break;
    default:
      throw new Error(
        `Unsupported storage provider: ${provider}. Supported providers are: s3, azure`
      );
  }

  return storageProvider;
}

/**
 * Reset the storage provider (useful for testing)
 */
export function resetStorageProvider(): void {
  storageProvider = null;
}

export { S3StorageProvider, AzureBlobStorageProvider };
export type { IStorageProvider, StorageFile, UploadOptions, DownloadOptions };
