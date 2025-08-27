/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

/**
 * Check if file is an image
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
  const extension = getFileExtension(filename).toLowerCase();
  return imageExtensions.includes(extension);
}

/**
 * Check if file is a video
 */
export function isVideoFile(filename: string): boolean {
  const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"];
  const extension = getFileExtension(filename).toLowerCase();
  return videoExtensions.includes(extension);
}

/**
 * Check if file is a document
 */
export function isDocumentFile(filename: string): boolean {
  const documentExtensions = ["pdf", "doc", "docx", "txt", "rtf", "odt"];
  const extension = getFileExtension(filename).toLowerCase();
  return documentExtensions.includes(extension);
}

/**
 * Generate a unique file path
 */
export function generateUniquePath(originalPath: string, existingPaths: string[]): string {
  const extension = getFileExtension(originalPath);
  const baseName = originalPath.replace(`.${extension}`, "");
  
  let counter = 1;
  let newPath = originalPath;
  
  while (existingPaths.includes(newPath)) {
    newPath = `${baseName}_${counter}.${extension}`;
    counter++;
  }
  
  return newPath;
}

/**
 * Validate file size
 */
export function validateFileSize(fileSize: number, maxSize: number): boolean {
  return fileSize <= maxSize;
}

/**
 * Validate file type
 */
export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = getFileExtension(filename).toLowerCase();
  return allowedTypes.includes(extension);
}
