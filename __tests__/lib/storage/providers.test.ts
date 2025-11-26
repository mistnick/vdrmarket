/**
 * Tests for Storage Providers
 */

import { S3StorageProvider } from '@/lib/storage/s3-storage.provider';
import { AzureBlobStorageProvider } from '@/lib/storage/azure-blob-storage.provider';

jest.mock('@azure/storage-blob', () => {
  return {
    BlobServiceClient: jest.fn().mockImplementation(() => ({
      getContainerClient: jest.fn().mockReturnValue({
        createIfNotExists: jest.fn(),
        getBlockBlobClient: jest.fn().mockReturnValue({
          upload: jest.fn(),
          download: jest.fn().mockResolvedValue({
            readableStreamBody: {
              on: jest.fn((event, cb) => {
                if (event === 'end') cb();
                return { on: jest.fn() }; // Chainable
              }),
            },
          }),
          getProperties: jest.fn().mockResolvedValue({
            contentLength: 100,
            contentType: 'application/pdf',
          }),
          generateSasUrl: jest.fn().mockResolvedValue('https://sas-url'),
          delete: jest.fn(),
          exists: jest.fn().mockResolvedValue(true),
        }),
        listBlobsFlat: jest.fn().mockReturnValue((async function* () {
          yield { name: 'test.pdf', properties: { contentLength: 100, contentType: 'application/pdf' } };
        })()),
      }),
    })),
    StorageSharedKeyCredential: jest.fn(),
    BlobSASPermissions: {
      parse: jest.fn(),
    },
  };
});

describe('Storage Providers', () => {
  describe('S3StorageProvider', () => {
    let provider: S3StorageProvider;

    beforeEach(() => {
      process.env.AWS_REGION = 'us-east-1';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
      provider = new S3StorageProvider();
    });

    afterEach(() => {
      delete process.env.AWS_REGION;
      delete process.env.AWS_S3_BUCKET;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
    });

    it('should initialize with correct config', () => {
      expect(provider).toBeInstanceOf(S3StorageProvider);
    });
  });

  describe('AzureBlobStorageProvider', () => {
    let provider: AzureBlobStorageProvider;

    beforeEach(() => {
      process.env.AZURE_STORAGE_ACCOUNT_NAME = 'testaccount';
      process.env.AZURE_STORAGE_ACCOUNT_KEY = 'testkey==';
      process.env.AZURE_STORAGE_CONTAINER_NAME = 'test-container';
      provider = new AzureBlobStorageProvider();
    });

    afterEach(() => {
      delete process.env.AZURE_STORAGE_ACCOUNT_NAME;
      delete process.env.AZURE_STORAGE_ACCOUNT_KEY;
      delete process.env.AZURE_STORAGE_CONTAINER_NAME;
    });

    it('should initialize with correct config', () => {
      expect(provider).toBeInstanceOf(AzureBlobStorageProvider);
    });
  });
});
