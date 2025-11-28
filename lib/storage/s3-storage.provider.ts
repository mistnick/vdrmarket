import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  IStorageProvider,
  StorageFile,
  UploadOptions,
  DownloadOptions,
} from './storage-provider.interface';

export class S3StorageProvider implements IStorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    const bucket = process.env.AWS_S3_BUCKET;
    const endpoint = process.env.AWS_ENDPOINT; // For MinIO or custom S3-compatible storage

    if (!bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is required');
    }

    this.bucket = bucket;

    const clientConfig: any = {
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    };

    // Add endpoint for MinIO or custom S3-compatible storage
    if (endpoint) {
      clientConfig.endpoint = endpoint;
      clientConfig.forcePathStyle = true; // Required for MinIO
    }

    this.client = new S3Client(clientConfig);
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } else {
        throw error;
      }
    }
  }

  async upload(
    key: string,
    file: Buffer | ReadableStream,
    options?: UploadOptions
  ): Promise<StorageFile> {
    await this.ensureBucketExists();

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file as Buffer,
      ContentType: options?.contentType,
      Metadata: options?.metadata,
    });

    await this.client.send(command);

    const metadata = await this.getMetadata(key);

    // Generate URL based on endpoint configuration
    // Use NEXT_PUBLIC_STORAGE_URL if available (for client-side access to MinIO)
    // Otherwise fall back to AWS_ENDPOINT or standard S3 URL
    const publicUrl = process.env.NEXT_PUBLIC_STORAGE_URL;
    const endpoint = process.env.AWS_ENDPOINT;

    let url;
    if (publicUrl) {
      url = `${publicUrl}/${this.bucket}/${key}`;
    } else if (endpoint) {
      url = `${endpoint}/${this.bucket}/${key}`;
    } else {
      url = `https://${this.bucket}.s3.amazonaws.com/${key}`;
    }

    return {
      key,
      url,
      size: metadata.size,
      contentType: metadata.contentType,
    };
  }

  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    
    // AWS SDK v3 returns a Readable stream (Node.js), not a web ReadableStream
    // Use transformToByteArray which is available on the response body
    if (!response.Body) {
      throw new Error('No body in response');
    }

    // The Body is a Readable stream in Node.js environment
    // Convert it to Buffer using the built-in method
    const bodyContents = await response.Body.transformToByteArray();
    return Buffer.from(bodyContents);
  }

  async getSignedUrl(
    key: string,
    options?: DownloadOptions
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options?.expiresIn || 3600, // 1 hour default
    });
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async deleteMany(keys: string[]): Promise<void> {
    const command = new DeleteObjectsCommand({
      Bucket: this.bucket,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
      },
    });

    await this.client.send(command);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async getMetadata(key: string): Promise<{
    size: number;
    contentType?: string;
    lastModified?: Date;
    metadata?: Record<string, string>;
  }> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType,
      lastModified: response.LastModified,
      metadata: response.Metadata,
    };
  }

  async list(prefix: string): Promise<StorageFile[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });

    const response = await this.client.send(command);

    // Generate URL based on endpoint configuration
    const endpoint = process.env.AWS_ENDPOINT;

    return (response.Contents || []).map(item => ({
      key: item.Key || '',
      url: endpoint
        ? `${endpoint}/${this.bucket}/${item.Key}`
        : `https://${this.bucket}.s3.amazonaws.com/${item.Key}`,
      size: item.Size || 0,
      contentType: undefined,
    }));
  }
}
