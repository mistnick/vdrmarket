#!/usr/bin/env npx ts-node
/**
 * Storage Migration Script
 * Migrates files from MinIO to external S3-compatible storage (e.g., Aruba Cloud Object Storage)
 *
 * Usage:
 *   npx ts-node scripts/migrate-storage.ts
 *
 * Environment variables required:
 *   SOURCE_* - Source storage (MinIO)
 *   TARGET_* - Target storage (Aruba Cloud)
 */

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// Source storage configuration (MinIO)
const SOURCE_CONFIG = {
  endpoint: process.env.SOURCE_ENDPOINT || 'http://localhost:9000',
  region: process.env.SOURCE_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.SOURCE_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.SOURCE_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,
};

// Target storage configuration (Aruba Cloud Object Storage)
const TARGET_CONFIG = {
  endpoint: process.env.TARGET_ENDPOINT || 'http://r1-it.storage.cloud.it',
  region: process.env.TARGET_REGION || 'r1-it',
  credentials: {
    accessKeyId: process.env.TARGET_ACCESS_KEY || '',
    secretAccessKey: process.env.TARGET_SECRET_KEY || '',
  },
  forcePathStyle: true,
};

const SOURCE_BUCKET = process.env.SOURCE_BUCKET || 'dataroom';
const TARGET_BUCKET = process.env.TARGET_BUCKET || 'dataroom';

interface MigrationResult {
  success: string[];
  failed: { key: string; error: string }[];
  skipped: string[];
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function ensureBucketExists(
  client: S3Client,
  bucket: string
): Promise<void> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`✓ Bucket "${bucket}" exists`);
  } catch (error: any) {
    if (
      error.name === 'NotFound' ||
      error.$metadata?.httpStatusCode === 404
    ) {
      console.log(`Creating bucket "${bucket}"...`);
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log(`✓ Bucket "${bucket}" created`);
    } else {
      throw error;
    }
  }
}

async function listAllObjects(
  client: S3Client,
  bucket: string
): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
    });

    const response = await client.send(command);
    
    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key) {
          keys.push(obj.Key);
        }
      }
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return keys;
}

async function copyObject(
  sourceClient: S3Client,
  targetClient: S3Client,
  key: string,
  sourceBucket: string,
  targetBucket: string
): Promise<void> {
  // Download from source
  const getCommand = new GetObjectCommand({
    Bucket: sourceBucket,
    Key: key,
  });

  const response = await sourceClient.send(getCommand);

  if (!response.Body) {
    throw new Error('Empty response body');
  }

  const body = await streamToBuffer(response.Body as Readable);

  // Upload to target
  const putCommand = new PutObjectCommand({
    Bucket: targetBucket,
    Key: key,
    Body: body,
    ContentType: response.ContentType,
    Metadata: response.Metadata,
  });

  await targetClient.send(putCommand);
}

async function checkObjectExists(
  client: S3Client,
  bucket: string,
  key: string
): Promise<boolean> {
  try {
    await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

async function migrate(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: [],
    failed: [],
    skipped: [],
  };

  // Validate target credentials
  if (!TARGET_CONFIG.credentials.accessKeyId || !TARGET_CONFIG.credentials.secretAccessKey) {
    console.error('❌ Error: TARGET_ACCESS_KEY and TARGET_SECRET_KEY are required');
    console.log('\nUsage:');
    console.log('  TARGET_ACCESS_KEY=your-key TARGET_SECRET_KEY=your-secret npx ts-node scripts/migrate-storage.ts');
    process.exit(1);
  }

  console.log('🚀 Storage Migration Script');
  console.log('============================');
  console.log(`Source: ${SOURCE_CONFIG.endpoint}/${SOURCE_BUCKET}`);
  console.log(`Target: ${TARGET_CONFIG.endpoint}/${TARGET_BUCKET}`);
  console.log('');

  // Initialize clients
  const sourceClient = new S3Client(SOURCE_CONFIG);
  const targetClient = new S3Client(TARGET_CONFIG);

  // Ensure target bucket exists
  console.log('Checking target bucket...');
  await ensureBucketExists(targetClient, TARGET_BUCKET);
  console.log('');

  // List all objects from source
  console.log('Listing objects from source...');
  const objects = await listAllObjects(sourceClient, SOURCE_BUCKET);
  console.log(`Found ${objects.length} objects to migrate`);
  console.log('');

  if (objects.length === 0) {
    console.log('No objects to migrate. Done!');
    return result;
  }

  // Check for --skip-existing flag
  const skipExisting = process.argv.includes('--skip-existing');
  if (skipExisting) {
    console.log('Note: Skipping objects that already exist in target');
    console.log('');
  }

  // Migrate each object
  let current = 0;
  for (const key of objects) {
    current++;
    const progress = `[${current}/${objects.length}]`;

    try {
      // Check if object already exists in target
      if (skipExisting) {
        const exists = await checkObjectExists(targetClient, TARGET_BUCKET, key);
        if (exists) {
          console.log(`${progress} ⏭ Skipped (exists): ${key}`);
          result.skipped.push(key);
          continue;
        }
      }

      await copyObject(sourceClient, targetClient, key, SOURCE_BUCKET, TARGET_BUCKET);
      console.log(`${progress} ✓ Migrated: ${key}`);
      result.success.push(key);
    } catch (error: any) {
      console.error(`${progress} ✗ Failed: ${key} - ${error.message}`);
      result.failed.push({ key, error: error.message });
    }
  }

  console.log('');
  console.log('============================');
  console.log('Migration Summary');
  console.log('============================');
  console.log(`✓ Success: ${result.success.length}`);
  console.log(`⏭ Skipped: ${result.skipped.length}`);
  console.log(`✗ Failed: ${result.failed.length}`);

  if (result.failed.length > 0) {
    console.log('');
    console.log('Failed objects:');
    for (const { key, error } of result.failed) {
      console.log(`  - ${key}: ${error}`);
    }
  }

  return result;
}

// Run migration
migrate()
  .then((result) => {
    if (result.failed.length > 0) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
