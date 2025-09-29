/**
 * Base file processor with common validation logic
 * Requirements: 2.1, 2.3
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  FileProcessor,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  FileProcessingOptions,
  ParsedScript,
} from '../../types/file-processing';
import { FileType, ScriptMetadata } from '../../types/script';

export abstract class BaseFileProcessor implements FileProcessor {
  protected readonly maxFileSize: number;
  protected readonly supportedExtensions: string[];

  constructor(
    supportedExtensions: string[],
    maxFileSize: number = 50 * 1024 * 1024 // 50MB default
  ) {
    this.supportedExtensions = supportedExtensions;
    this.maxFileSize = maxFileSize;
  }

  abstract parseFile(
    filePath: string,
    fileType: FileType
  ): Promise<ParsedScript>;

  async validateFile(filePath: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let fileSize = 0;
    let isReadable = false;
    let detectedFileType: FileType | undefined;

    try {
      // Check if file exists and get stats
      const stats = await fs.stat(filePath);

      if (!stats.isFile()) {
        errors.push({
          code: 'FILE_NOT_FOUND',
          message: 'Path does not point to a valid file',
          details: `Path: ${filePath}`,
          suggestions: ['Ensure the path points to a file, not a directory'],
        });

        return {
          isValid: false,
          errors,
          warnings,
          fileSize: 0,
          isReadable: false,
        };
      }

      fileSize = stats.size;

      // Check file size
      if (fileSize === 0) {
        errors.push({
          code: 'EMPTY_FILE',
          message: 'File is empty',
          details: `File size: ${fileSize} bytes`,
          suggestions: ['Ensure the file contains content'],
        });
      } else if (fileSize > this.maxFileSize) {
        errors.push({
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds maximum allowed size of ${this.formatFileSize(this.maxFileSize)}`,
          details: `File size: ${this.formatFileSize(fileSize)}`,
          suggestions: [
            'Try compressing the file',
            'Split large documents into smaller sections',
            'Use a different file format',
          ],
        });
      }

      // Check for large file warning (but not if it's already an error)
      if (fileSize > 10 * 1024 * 1024 && fileSize <= this.maxFileSize) {
        // 10MB warning threshold
        warnings.push({
          code: 'LARGE_FILE_SIZE',
          message: `Large file detected (${this.formatFileSize(fileSize)})`,
          details: 'Processing may take longer than usual',
        });
      }

      // Detect file type by extension
      const extension = path.extname(filePath).toLowerCase();
      detectedFileType = this.detectFileType(extension);

      if (!detectedFileType) {
        errors.push({
          code: 'UNSUPPORTED_FORMAT',
          message: `Unsupported file format: ${extension}`,
          details: `Supported formats: ${this.supportedExtensions.join(', ')}`,
          suggestions: [
            'Convert the file to a supported format',
            `Supported formats: ${this.supportedExtensions.join(', ')}`,
          ],
        });
      }

      // Check file readability
      try {
        await fs.access(filePath, fs.constants.R_OK);
        isReadable = true;
      } catch (accessError) {
        errors.push({
          code: 'PERMISSION_DENIED',
          message: 'File is not readable',
          details: `Access error: ${accessError instanceof Error ? accessError.message : 'Unknown error'}`,
          suggestions: [
            'Check file permissions',
            'Ensure the file is not locked by another application',
          ],
        });
      }
    } catch (error) {
      errors.push({
        code: 'FILE_NOT_FOUND',
        message: 'File not found or inaccessible',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestions: [
          'Verify the file path is correct',
          'Ensure the file exists',
        ],
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      detectedFileType,
      fileSize,
      isReadable,
    };
  }

  getSupportedExtensions(): string[] {
    return [...this.supportedExtensions];
  }

  isSupported(fileType: string): boolean {
    const extension = fileType.startsWith('.') ? fileType : `.${fileType}`;
    return this.supportedExtensions.includes(extension.toLowerCase());
  }

  protected detectFileType(extension: string): FileType | undefined {
    const ext = extension.toLowerCase();

    if (['.pdf'].includes(ext)) return 'pdf';
    if (['.docx', '.doc'].includes(ext)) return 'docx';
    if (['.txt', '.text'].includes(ext)) return 'txt';

    return undefined;
  }

  protected formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  protected createScriptMetadata(
    title: string,
    content: string,
    fileSize: number,
    additionalMetadata?: Record<string, unknown>
  ): ScriptMetadata {
    const wordCount = this.countWords(content);
    const characterCount = content.length;

    return {
      title,
      wordCount,
      characterCount,
      fileSize,
      additionalMetadata,
    };
  }

  protected countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  protected extractTitleFromContent(
    content: string,
    fallbackTitle: string
  ): string {
    // Try to extract title from first few lines
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) return fallbackTitle;

    // Look for a title-like line (short, at the beginning)
    const firstLine = lines[0];
    if (
      firstLine.length > 0 &&
      firstLine.length < 100 &&
      !firstLine.includes('.')
    ) {
      return firstLine;
    }

    return fallbackTitle;
  }

  protected async validateFileContent(
    content: string
  ): Promise<ValidationWarning[]> {
    const warnings: ValidationWarning[] = [];

    // Check for very low text content (less than 50 characters)
    if (content.trim().length < 50) {
      warnings.push({
        code: 'LOW_TEXT_CONTENT',
        message: 'File contains very little text content',
        details: `Content length: ${content.length} characters`,
      });
    }

    // Check for potential encoding issues
    if (content.includes('�') || content.includes('\uFFFD')) {
      warnings.push({
        code: 'POTENTIAL_ENCODING_ISSUE',
        message: 'File may have encoding issues',
        details:
          'Detected replacement characters that may indicate encoding problems',
      });
    }

    return warnings;
  }
}
