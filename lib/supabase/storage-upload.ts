import { createClient } from "@/lib/supabase/server";

// Storage bucket names
export const STORAGE_BUCKETS = {
  BRANDING: "branding",
  DOCUMENTS: "documents",
  AVATARS: "avatars",
  ATTACHMENTS: "attachments",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

// Allowed file types for different purposes
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export const ALLOWED_FAVICON_TYPES = [
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/png",
  "image/svg+xml",
];

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

// Max file sizes (in bytes)
export const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  FAVICON: 1 * 1024 * 1024, // 1MB
  DOCUMENT: 25 * 1024 * 1024, // 25MB
  AVATAR: 2 * 1024 * 1024, // 2MB
};

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface UploadOptions {
  bucket: StorageBucket;
  path: string;
  file: File | Blob;
  contentType?: string;
  upsert?: boolean;
  cacheControl?: string;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const {
    bucket,
    path,
    file,
    contentType,
    upsert = true,
    cacheControl = "3600",
  } = options;

  try {
    const supabase = await createClient();

    // Upload the file
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType,
      upsert,
      cacheControl,
    });

    if (error) {
      console.error("Storage upload error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error("Storage delete error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Replace a file (delete old and upload new)
 */
export async function replaceFile(
  bucket: StorageBucket,
  oldPath: string | undefined,
  newPath: string,
  file: File | Blob,
  contentType?: string
): Promise<UploadResult> {
  // Delete old file if exists
  if (oldPath) {
    await deleteFile(bucket, oldPath);
  }

  // Upload new file
  return uploadFile({
    bucket,
    path: newPath,
    file,
    contentType,
    upsert: true,
  });
}

/**
 * Generate a unique file path with workspace ID
 */
export function generateFilePath(
  workspaceId: string,
  folder: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${workspaceId}/${folder}/${timestamp}-${sanitizedName}`;
}

/**
 * Extract file path from a storage URL
 */
export function extractPathFromUrl(url: string, bucket: StorageBucket): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(
      new RegExp(`/storage/v1/object/public/${bucket}/(.+)`)
    );
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

/**
 * Validate file type
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }
  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(
  file: File,
  maxSize: number
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
    };
  }
  return { valid: true };
}

/**
 * Upload a branding asset (logo, favicon)
 */
export async function uploadBrandingAsset(
  workspaceId: string,
  type: "logo_light" | "logo_dark" | "favicon",
  file: File,
  oldUrl?: string
): Promise<UploadResult> {
  // Validate file type
  const allowedTypes = type === "favicon" ? ALLOWED_FAVICON_TYPES : ALLOWED_IMAGE_TYPES;
  const typeValidation = validateFileType(file, allowedTypes);
  if (!typeValidation.valid) {
    return { success: false, error: typeValidation.error };
  }

  // Validate file size
  const maxSize = type === "favicon" ? MAX_FILE_SIZES.FAVICON : MAX_FILE_SIZES.IMAGE;
  const sizeValidation = validateFileSize(file, maxSize);
  if (!sizeValidation.valid) {
    return { success: false, error: sizeValidation.error };
  }

  // Generate path
  const extension = file.name.split(".").pop() || "png";
  const path = `${workspaceId}/${type}.${extension}`;

  // Extract old path if exists
  let oldPath: string | undefined;
  if (oldUrl) {
    oldPath = extractPathFromUrl(oldUrl, STORAGE_BUCKETS.BRANDING) || undefined;
  }

  // Upload (or replace)
  return replaceFile(STORAGE_BUCKETS.BRANDING, oldPath, path, file, file.type);
}

/**
 * Upload an avatar
 */
export async function uploadAvatar(
  userId: string,
  file: File,
  oldUrl?: string
): Promise<UploadResult> {
  // Validate file type
  const typeValidation = validateFileType(file, ALLOWED_IMAGE_TYPES);
  if (!typeValidation.valid) {
    return { success: false, error: typeValidation.error };
  }

  // Validate file size
  const sizeValidation = validateFileSize(file, MAX_FILE_SIZES.AVATAR);
  if (!sizeValidation.valid) {
    return { success: false, error: sizeValidation.error };
  }

  // Generate path
  const extension = file.name.split(".").pop() || "png";
  const path = `${userId}/avatar.${extension}`;

  // Extract old path if exists
  let oldPath: string | undefined;
  if (oldUrl) {
    oldPath = extractPathFromUrl(oldUrl, STORAGE_BUCKETS.AVATARS) || undefined;
  }

  // Upload (or replace)
  return replaceFile(STORAGE_BUCKETS.AVATARS, oldPath, path, file, file.type);
}

/**
 * Upload a document
 */
export async function uploadDocument(
  workspaceId: string,
  file: File,
  folder: string = "general"
): Promise<UploadResult> {
  // Validate file type
  const allowedTypes = [...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_IMAGE_TYPES];
  const typeValidation = validateFileType(file, allowedTypes);
  if (!typeValidation.valid) {
    return { success: false, error: typeValidation.error };
  }

  // Validate file size
  const sizeValidation = validateFileSize(file, MAX_FILE_SIZES.DOCUMENT);
  if (!sizeValidation.valid) {
    return { success: false, error: sizeValidation.error };
  }

  // Generate path
  const path = generateFilePath(workspaceId, folder, file.name);

  // Upload
  return uploadFile({
    bucket: STORAGE_BUCKETS.DOCUMENTS,
    path,
    file,
    contentType: file.type,
    upsert: false,
  });
}

/**
 * List files in a folder
 */
export async function listFiles(
  bucket: StorageBucket,
  folder: string
): Promise<{ files: { name: string; size: number; created_at: string }[]; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.storage.from(bucket).list(folder);

    if (error) {
      return { files: [], error: error.message };
    }

    return {
      files: (data || []).map((file) => ({
        name: file.name,
        size: file.metadata?.size || 0,
        created_at: file.created_at || "",
      })),
    };
  } catch (error) {
    return {
      files: [],
      error: error instanceof Error ? error.message : "Failed to list files",
    };
  }
}
