import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  ContainerClient,
  BlockBlobClient,
  BlobDownloadResponseParsed,
  BlobSASPermissions,
} from '@azure/storage-blob';
import { Readable } from 'stream';
import {
  IStorageProvider,
  StorageFile,
  UploadOptions,
  DownloadOptions,
} from './storage-provider.interface';

export class AzureBlobStorageProvider implements IStorageProvider {
  private containerClient: ContainerClient;
  private accountName: string;

  constructor() {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

    if (!accountName || !accountKey || !containerName) {
      throw new Error(
        'AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY, and AZURE_STORAGE_CONTAINER_NAME are required'
      );
    }

    this.accountName = accountName;

    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey
    );

    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );

    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  async upload(
    key: string,
    file: Buffer | ReadableStream,
    options?: UploadOptions
  ): Promise<StorageFile> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);

    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: options?.contentType,
      },
      metadata: options?.metadata,
    };

    if (Buffer.isBuffer(file)) {
      await blockBlobClient.upload(file, file.length, uploadOptions);
    } else {
      // Convert web ReadableStream to Node Readable
      const buffer = await this.streamToBuffer(file as any);
      await blockBlobClient.upload(buffer, buffer.length, uploadOptions);
    }

    const properties = await blockBlobClient.getProperties();

    return {
      key,
      url: blockBlobClient.url,
      size: properties.contentLength || 0,
      contentType: properties.contentType,
    };
  }

  async download(key: string): Promise<Buffer> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);
    const downloadResponse = await blockBlobClient.download(0);

    if (!downloadResponse.readableStreamBody) {
      throw new Error('Failed to download blob: no stream body');
    }

    return this.streamToBuffer(downloadResponse.readableStreamBody);
  }

  async getSignedUrl(
    key: string,
    options?: DownloadOptions
  ): Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);
    
    const expiresOn = new Date();
    expiresOn.setSeconds(
      expiresOn.getSeconds() + (options?.expiresIn || 3600)
    );

    // Generate SAS token
    const permissions = BlobSASPermissions.parse('r');
    const sasUrl = await blockBlobClient.generateSasUrl({
      permissions,
      expiresOn,
    });

    return sasUrl;
  }

  async delete(key: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);
    await blockBlobClient.delete();
  }

  async deleteMany(keys: string[]): Promise<void> {
    // Azure doesn't have batch delete, so we delete one by one
    await Promise.all(keys.map(key => this.delete(key)));
  }

  async exists(key: string): Promise<boolean> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);
    return blockBlobClient.exists();
  }

  async getMetadata(key: string): Promise<{
    size: number;
    contentType?: string;
    lastModified?: Date;
    metadata?: Record<string, string>;
  }> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);
    const properties = await blockBlobClient.getProperties();

    return {
      size: properties.contentLength || 0,
      contentType: properties.contentType,
      lastModified: properties.lastModified,
      metadata: properties.metadata,
    };
  }

  async list(prefix: string): Promise<StorageFile[]> {
    const files: StorageFile[] = [];

    for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
      files.push({
        key: blob.name,
        url: `https://${this.accountName}.blob.core.windows.net/${this.containerClient.containerName}/${blob.name}`,
        size: blob.properties.contentLength || 0,
        contentType: blob.properties.contentType,
      });
    }

    return files;
  }

  private async streamToBuffer(
    readableStream: NodeJS.ReadableStream
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (data: Buffer) => {
        chunks.push(data);
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }
}
