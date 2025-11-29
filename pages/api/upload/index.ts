/**
 * Large File Upload API Route (Pages Router)
 * 
 * Uses Pages Router for better support of large file uploads.
 * Next.js App Router has limitations with formData() for large files.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, File as FormidableFile, Fields, Files } from "formidable";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/db/prisma";
import { getStorageProvider } from "@/lib/storage";
import { validateFile, generateSecureStorageKey } from "@/lib/security/file-validation";
import { scanFile } from "@/lib/security/malware-scanner";
import { AuditService } from "@/lib/audit/audit-service";

// Disable default body parser to handle file uploads manually
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

// Parse form with formidable
const parseForm = (
  req: NextApiRequest
): Promise<{ fields: Fields; files: Files }> => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: 500 * 1024 * 1024, // 500MB max
      maxFields: 10,
      keepExtensions: true,
      multiples: false,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
};

// Get session from cookies for Pages Router
async function getSessionFromCookies(req: NextApiRequest) {
  console.log("[UPLOAD] Cookies received:", Object.keys(req.cookies));
  
  // Try custom session cookie (our database-backed session)
  const sessionToken = req.cookies["dataroom-session"];
  console.log("[UPLOAD] dataroom-session token:", sessionToken ? "found" : "not found");
  
  if (sessionToken) {
    try {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      console.log("[UPLOAD] Session from DB:", session ? `found (expires: ${session.expires})` : "not found");
      if (session && session.expires > new Date()) {
        return { email: session.user.email, userId: session.user.id };
      }
    } catch (e) {
      console.error("[UPLOAD] Error getting session:", e);
    }
  }

  // Try NextAuth session cookie as fallback
  const nextAuthToken = req.cookies["authjs.session-token"] || 
                        req.cookies["__Secure-authjs.session-token"];
  console.log("[UPLOAD] NextAuth token:", nextAuthToken ? "found" : "not found");
  
  if (nextAuthToken) {
    try {
      const nextSession = await prisma.session.findUnique({
        where: { sessionToken: nextAuthToken },
        include: { user: true },
      });
      console.log("[UPLOAD] NextAuth session from DB:", nextSession ? "found" : "not found");
      if (nextSession && nextSession.expires > new Date()) {
        return { email: nextSession.user.email, userId: nextSession.user.id };
      }
    } catch (e) {
      console.error("[UPLOAD] Error getting NextAuth session:", e);
    }
  }

  console.log("[UPLOAD] No valid session found");
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    // Get session
    const session = await getSessionFromCookies(req);

    if (!session?.email) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Parse form data
    const { fields, files } = await parseForm(req);

    // Get file from parsed data
    const uploadedFile = files.file;
    if (!uploadedFile) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    // Handle both single file and array
    const file: FormidableFile = Array.isArray(uploadedFile) 
      ? uploadedFile[0] 
      : uploadedFile;

    // Get form fields
    const dataRoomId = Array.isArray(fields.dataRoomId) 
      ? fields.dataRoomId[0] 
      : fields.dataRoomId;
    const folderId = Array.isArray(fields.folderId) 
      ? fields.folderId[0] 
      : fields.folderId;
    const name = Array.isArray(fields.name) 
      ? fields.name[0] 
      : fields.name;
    const description = Array.isArray(fields.description) 
      ? fields.description[0] 
      : fields.description;
    const index = Array.isArray(fields.index)
      ? fields.index[0]
      : fields.index;

    if (!dataRoomId) {
      return res.status(400).json({ 
        success: false, 
        error: "dataRoomId is required" 
      });
    }

    // Validate index format if provided
    if (index) {
      const indexPattern = /^\d+(\.\d+)*$/;
      if (!indexPattern.test(index)) {
        return res.status(400).json({
          success: false,
          error: "Invalid index format. Use numbers separated by dots (e.g., 1.2.3)"
        });
      }
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.email },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Check data room membership
    const membership = await prisma.groupMember.findFirst({
      where: {
        userId: user.id,
        group: {
          dataRoomId,
        },
      },
      include: {
        group: true,
      },
    });

    if (!membership) {
      return res.status(403).json({ 
        success: false, 
        error: "Not a member of this data room" 
      });
    }

    // Get data room settings
    const dataRoom = await prisma.dataRoom.findUnique({
      where: { id: dataRoomId },
      select: {
        maxFileSize: true,
        allowedFileTypes: true,
      },
    });

    if (!dataRoom) {
      return res.status(404).json({ 
        success: false, 
        error: "Data room not found" 
      });
    }

    // Read file buffer
    const fileBuffer = await fs.readFile(file.filepath);
    const fileName = file.originalFilename || "unnamed";
    const fileType = file.mimetype || "application/octet-stream";
    const fileSize = file.size;

    // Create a File-like object for validation
    const fileObj = {
      name: fileName,
      type: fileType,
      size: fileSize,
    } as File;

    // Validate file
    const validation = await validateFile(fileObj, fileBuffer, {
      maxSize: dataRoom.maxFileSize,
      customWhitelist: dataRoom.allowedFileTypes as string[] | undefined,
    });

    if (!validation.valid) {
      // Clean up temp file
      await fs.unlink(file.filepath).catch(() => {});
      return res.status(400).json({ 
        success: false, 
        error: validation.error || "File validation failed" 
      });
    }

    // Scan for malware
    const scanResult = await scanFile(fileBuffer, fileName);

    if (scanResult.status === "infected") {
      // Clean up temp file
      await fs.unlink(file.filepath).catch(() => {});
      console.warn(`[Security] Blocked infected file upload: ${fileName}`, scanResult);
      return res.status(400).json({ 
        success: false, 
        error: "File failed security scan and cannot be uploaded" 
      });
    }

    // Upload to storage
    const storage = getStorageProvider();
    const fileKey = generateSecureStorageKey(
      dataRoomId, 
      validation.sanitizedFilename || fileName
    );

    const uploadResult = await storage.upload(fileKey, fileBuffer, {
      contentType: fileType,
      metadata: {
        originalName: encodeURIComponent(fileName),
        uploadedBy: user.id,
      },
    });

    // Clean up temp file
    await fs.unlink(file.filepath).catch(() => {});

    // Create document record
    const document = await prisma.document.create({
      data: {
        name: name || validation.sanitizedFilename || fileName,
        description: description || null,
        file: uploadResult.key,
        fileType: validation.detectedMimeType || fileType,
        fileSize: fileSize,
        dataRoomId,
        ownerId: user.id,
        folderId: folderId || null,
        index: index || null,
        scanStatus: scanResult.status,
        scanResult: scanResult as any,
      },
      include: {
        owner: true,
        dataRoom: true,
        folder: true,
      },
    });

    // Log audit event
    await AuditService.log({
      dataRoomId,
      userId: user.id,
      action: "created",
      resourceType: "document",
      resourceId: document.id,
      metadata: {
        documentName: document.name,
        fileSize: fileSize,
        fileType: fileType,
      },
    });

    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    console.error("Error uploading document:", error);
    
    // Handle specific errors
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ 
        success: false, 
        error: "File size exceeds maximum allowed size" 
      });
    }

    return res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
}
