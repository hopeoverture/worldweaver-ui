/**
 * File Upload Security Validation
 * 
 * Provides comprehensive security checks for file uploads including:
 * - File type validation
 * - Size limits
 * - Content scanning
 * - Malicious file detection
 */

import { logAuditEvent, logError } from '../logging';

// Allowed MIME types for uploads
const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  
  // Documents
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  
  // Archives (with caution)
  'application/zip',
  'application/x-zip-compressed',
]);

// File extensions that should never be allowed
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.scr', '.pif',
  '.js', '.jar', '.vbs', '.ps1', '.sh', '.php',
  '.asp', '.jsp', '.py', '.rb', '.pl', '.cgi',
]);

// Maximum file sizes by type (in bytes)
const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB for images
  document: 25 * 1024 * 1024, // 25MB for documents  
  archive: 50 * 1024 * 1024, // 50MB for archives
  default: 5 * 1024 * 1024, // 5MB default
};

// Malicious file signatures (magic bytes)
const MALICIOUS_SIGNATURES = [
  // Executable signatures
  { signature: [0x4D, 0x5A], description: 'PE executable (Windows)' },
  { signature: [0x7F, 0x45, 0x4C, 0x46], description: 'ELF executable (Linux)' },
  { signature: [0xFE, 0xED, 0xFA, 0xCE], description: 'Mach-O executable (macOS)' },
  { signature: [0xFE, 0xED, 0xFA, 0xCF], description: 'Mach-O executable (macOS 64-bit)' },
  
  // Script signatures
  { signature: [0x23, 0x21], description: 'Shell script (#!/...)' },
];

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedName: string;
  detectedType: string;
}

export interface FileUploadContext {
  userId: string;
  worldId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Comprehensive file validation
 */
export async function validateFileUpload(
  file: File,
  context: FileUploadContext
): Promise<FileValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Basic validation
    if (!file || !file.name) {
      errors.push('File is required');
      return { isValid: false, errors, warnings, sanitizedName: '', detectedType: '' };
    }

    const fileName = file.name;
    const fileSize = file.size;
    const mimeType = file.type || 'application/octet-stream';
    
    // Sanitize filename
    const sanitizedName = sanitizeFileName(fileName);
    if (sanitizedName !== fileName) {
      warnings.push('Filename was sanitized for security');
    }
    
    // File extension validation
    const extension = getFileExtension(fileName).toLowerCase();
    if (DANGEROUS_EXTENSIONS.has(extension)) {
      errors.push(`File extension '${extension}' is not allowed for security reasons`);
    }
    
    // MIME type validation
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      errors.push(`File type '${mimeType}' is not allowed`);
    }
    
    // Size validation
    const maxSize = getMaxFileSize(mimeType);
    if (fileSize > maxSize) {
      errors.push(`File size (${formatFileSize(fileSize)}) exceeds limit (${formatFileSize(maxSize)})`);
    }
    
    // Content validation
    const contentValidation = await validateFileContent(file);
    if (!contentValidation.isValid) {
      errors.push(...contentValidation.errors);
      warnings.push(...contentValidation.warnings);
    }
    
    const isValid = errors.length === 0;
    const detectedType = detectFileType(mimeType);
    
    // Audit log for file upload attempt
    logAuditEvent('file_upload_validation', {
      ...context,
      action: 'validate_file_upload',
      metadata: {
        fileName: sanitizedName,
        originalFileName: fileName,
        fileSize,
        mimeType,
        detectedType,
        isValid,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    });
    
    return {
      isValid,
      errors,
      warnings,
      sanitizedName,
      detectedType,
    };
    
  } catch (error) {
    logError('File validation error', error as Error, {
      ...context,
      action: 'validate_file_upload_error',
      metadata: { fileName: file.name }
    });
    
    errors.push('File validation failed due to internal error');
    return { isValid: false, errors, warnings, sanitizedName: '', detectedType: '' };
  }
}

/**
 * Validate file content for malicious signatures
 */
async function validateFileContent(file: File): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Read first 1KB of file for signature checking
    const buffer = await file.slice(0, 1024).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Check for malicious signatures
    for (const { signature, description } of MALICIOUS_SIGNATURES) {
      if (bytesStartWith(bytes, signature)) {
        errors.push(`Potentially malicious file detected: ${description}`);
      }
    }
    
    // Additional content checks based on MIME type
    const mimeType = file.type;
    
    if (mimeType.startsWith('image/')) {
      // Basic image validation
      if (bytes.length < 10) {
        errors.push('Invalid image file: too small');
      }
    } else if (mimeType === 'application/pdf') {
      // PDF signature check
      const pdfSignature = [0x25, 0x50, 0x44, 0x46]; // %PDF
      if (!bytesStartWith(bytes, pdfSignature)) {
        errors.push('Invalid PDF file: missing PDF signature');
      }
    }
    
    return { isValid: errors.length === 0, errors, warnings };
    
  } catch (error) {
    errors.push('Could not validate file content');
    return { isValid: false, errors, warnings };
  }
}

/**
 * Helper functions
 */
function sanitizeFileName(filename: string): string {
  // Remove path traversal attempts and dangerous characters
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .slice(0, 255); // Limit length
}

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot);
}

function getMaxFileSize(mimeType: string): number {
  if (mimeType.startsWith('image/')) {
    return MAX_FILE_SIZES.image;
  } else if (mimeType.startsWith('application/pdf') || mimeType.startsWith('text/')) {
    return MAX_FILE_SIZES.document;
  } else if (mimeType.includes('zip')) {
    return MAX_FILE_SIZES.archive;
  }
  return MAX_FILE_SIZES.default;
}

function detectFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('text/') || mimeType === 'application/pdf') return 'document';
  if (mimeType.includes('zip')) return 'archive';
  return 'other';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function bytesStartWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

/**
 * Rate limiting for file uploads
 */
const UPLOAD_RATE_LIMITS = {
  perMinute: 10, // Max 10 uploads per minute
  perHour: 100,  // Max 100 uploads per hour
  perDay: 500,   // Max 500 uploads per day
};

export async function checkUploadRateLimit(userId: string): Promise<{ allowed: boolean; message?: string }> {
  // This would integrate with your existing rate limiting system
  // For now, return allowed
  return { allowed: true };
}