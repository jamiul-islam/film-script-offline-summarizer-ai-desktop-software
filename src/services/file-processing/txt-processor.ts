/**
 * TXT file processor implementation
 * Requirements: 2.1, 2.2
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as iconv from 'iconv-lite';
import { BaseFileProcessor } from './base-processor';
import { ParsedScript, ValidationResult } from '../../types/file-processing';
import { FileType } from '../../types/script';

export class TxtProcessor extends BaseFileProcessor {
  constructor() {
    super(['.txt', '.text'], 10 * 1024 * 1024); // 10MB max for text files
  }

  async parseFile(filePath: string, fileType: FileType): Promise<ParsedScript> {
    try {
      // First validate the file
      const validation = await this.validateFile(filePath);
      if (!validation.isValid) {
        throw new Error(
          `TXT validation failed: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      // Read the text file with encoding detection
      const {
        content,
        encoding,
        confidence: encodingConfidence,
      } = await this.readTextFileWithEncoding(filePath);

      // Extract metadata
      const fileName = path.basename(filePath, path.extname(filePath));
      const title = this.extractTitleFromContent(content, fileName);

      // Create additional metadata specific to TXT
      const lines = content.split('\n');
      const additionalMetadata = {
        encoding,
        encodingConfidence,
        lineCount: lines.length,
        averageLineLength:
          content.length > 0 ? content.length / lines.length : 0,
        hasWindowsLineEndings: content.includes('\r\n'),
        hasMacLineEndings: content.includes('\r') && !content.includes('\r\n'),
        isEmpty: content.trim().length === 0,
      };

      // Create script metadata
      const metadata = this.createScriptMetadata(
        title,
        content,
        validation.fileSize,
        additionalMetadata
      );

      // Add line count to metadata
      metadata.additionalMetadata = {
        ...metadata.additionalMetadata,
        lineCount: lines.length,
      };

      // Validate content and collect warnings
      const contentWarnings = await this.validateFileContent(content);
      const warnings: string[] = [];

      // Add TXT-specific warnings
      if (content.trim().length === 0) {
        warnings.push('Text file is empty');
      }

      if (encodingConfidence < 0.8) {
        warnings.push(
          `Low confidence in encoding detection (${encoding}): ${(encodingConfidence * 100).toFixed(1)}%`
        );
      }

      // Check for potential binary content
      if (this.containsBinaryContent(content)) {
        warnings.push(
          'File may contain binary content or use an unsupported encoding'
        );
      }

      // Check for very long lines (potential formatting issues)
      const maxLineLength = Math.max(...lines.map(line => line.length));
      if (maxLineLength > 1000) {
        warnings.push(
          `Very long lines detected (max: ${maxLineLength} characters) - may indicate formatting issues`
        );
      }

      // Add content validation warnings
      contentWarnings.forEach(warning => {
        warnings.push(`${warning.code}: ${warning.message}`);
      });

      return {
        content,
        title,
        metadata,
        warnings: warnings.length > 0 ? warnings : undefined,
        confidence: this.calculateConfidence(
          content,
          encoding,
          encodingConfidence,
          validation.fileSize
        ),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse TXT file: ${error.message}`);
      }
      throw new Error('Failed to parse TXT file: Unknown error');
    }
  }

  private async readTextFileWithEncoding(filePath: string): Promise<{
    content: string;
    encoding: string;
    confidence: number;
  }> {
    try {
      // Read file as buffer first
      const buffer = await fs.readFile(filePath);

      // Detect encoding
      const detectedEncoding = this.detectEncoding(buffer);

      // Try to decode with detected encoding
      let content: string;
      let actualEncoding = detectedEncoding.encoding;
      let confidence = detectedEncoding.confidence;

      try {
        if (iconv.encodingExists(actualEncoding)) {
          content = iconv.decode(buffer, actualEncoding);
        } else {
          // Fallback to UTF-8
          content = buffer.toString('utf8');
          actualEncoding = 'utf8';
          confidence = 0.5;
        }
      } catch (decodeError) {
        // If decoding fails, try UTF-8 as fallback
        content = buffer.toString('utf8');
        actualEncoding = 'utf8';
        confidence = 0.3;
      }

      return {
        content,
        encoding: actualEncoding,
        confidence,
      };
    } catch (error) {
      throw new Error(
        `Failed to read text file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private detectEncoding(buffer: Buffer): {
    encoding: string;
    confidence: number;
  } {
    // Simple encoding detection based on byte patterns

    // Check for BOM (Byte Order Mark)
    if (buffer.length >= 3) {
      // UTF-8 BOM
      if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
        return { encoding: 'utf8', confidence: 1.0 };
      }
    }

    if (buffer.length >= 2) {
      // UTF-16 LE BOM
      if (buffer[0] === 0xff && buffer[1] === 0xfe) {
        return { encoding: 'utf16le', confidence: 1.0 };
      }
      // UTF-16 BE BOM
      if (buffer[0] === 0xfe && buffer[1] === 0xff) {
        return { encoding: 'utf16be', confidence: 1.0 };
      }
    }

    // Check for null bytes (indicates UTF-16 or binary)
    const nullBytes = buffer.filter(byte => byte === 0).length;
    if (nullBytes > buffer.length * 0.1) {
      // Too many null bytes, likely UTF-16 or binary
      if (nullBytes % 2 === 0) {
        return { encoding: 'utf16le', confidence: 0.7 };
      }
      return { encoding: 'binary', confidence: 0.3 };
    }

    // Check for high-bit characters (indicates non-ASCII)
    const highBitBytes = buffer.filter(byte => byte > 127).length;
    if (highBitBytes === 0) {
      // Pure ASCII
      return { encoding: 'ascii', confidence: 0.9 };
    }

    // Try to validate as UTF-8
    try {
      const utf8String = buffer.toString('utf8');
      // Check for replacement characters
      const replacementChars = (utf8String.match(/�/g) || []).length;
      if (replacementChars === 0) {
        return { encoding: 'utf8', confidence: 0.8 };
      } else if (replacementChars < utf8String.length * 0.01) {
        return { encoding: 'utf8', confidence: 0.6 };
      }
    } catch {
      // UTF-8 validation failed
    }

    // Check for common Windows-1252 characters
    const windows1252Indicators = buffer.filter(
      byte => (byte >= 0x80 && byte <= 0x9f) || byte === 0xa0
    ).length;

    if (windows1252Indicators > 0) {
      return { encoding: 'windows1252', confidence: 0.6 };
    }

    // Default to UTF-8 with low confidence
    return { encoding: 'utf8', confidence: 0.5 };
  }

  private containsBinaryContent(content: string): boolean {
    // Check for common binary indicators
    const binaryIndicators = [
      '\x00', // Null bytes
      '\x01',
      '\x02',
      '\x03',
      '\x04',
      '\x05',
      '\x06',
      '\x07', // Control characters
      '\x0E',
      '\x0F',
      '\x10',
      '\x11',
      '\x12',
      '\x13',
      '\x14',
      '\x15',
      '\x16',
      '\x17',
      '\x18',
      '\x19',
      '\x1A',
      '\x1B',
      '\x1C',
      '\x1D',
      '\x1E',
      '\x1F',
    ];

    const binaryCharCount = binaryIndicators.reduce((count, char) => {
      return count + (content.split(char).length - 1);
    }, 0);

    // If more than 1% of characters are binary indicators, likely binary
    return binaryCharCount > content.length * 0.01;
  }

  private calculateConfidence(
    content: string,
    encoding: string,
    encodingConfidence: number,
    fileSize: number
  ): number {
    let confidence = 1.0;

    // Reduce confidence for empty or very short content
    if (content.trim().length === 0) {
      confidence = 0.1;
    } else if (content.trim().length < 50) {
      confidence = 0.3;
    }

    // Factor in encoding confidence
    confidence *= encodingConfidence;

    // Reduce confidence for binary content indicators
    if (this.containsBinaryContent(content)) {
      confidence *= 0.3;
    }

    // Reduce confidence for very low text-to-size ratio (might indicate encoding issues)
    const textToSizeRatio = content.length / fileSize;
    if (textToSizeRatio < 0.5) {
      confidence *= 0.7;
    }

    // Reduce confidence for unknown or fallback encodings
    if (encoding === 'binary') {
      confidence *= 0.2;
    } else if (encoding === 'utf8' && encodingConfidence < 0.6) {
      confidence *= 0.8;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  async validateFile(filePath: string): Promise<ValidationResult> {
    // Get base validation
    const baseValidation = await super.validateFile(filePath);

    // For TXT files, empty files should be valid but with warnings
    // Remove empty file error if it exists and convert to warning
    const emptyFileErrorIndex = baseValidation.errors.findIndex(
      e => e.code === 'EMPTY_FILE'
    );
    if (emptyFileErrorIndex !== -1) {
      baseValidation.errors.splice(emptyFileErrorIndex, 1);
      baseValidation.warnings.push({
        code: 'LOW_TEXT_CONTENT',
        message: 'Text file is empty',
        details: 'File contains no content',
      });
      // If this was the only error, mark as valid
      if (baseValidation.errors.length === 0) {
        baseValidation.isValid = true;
      }
    }

    if (!baseValidation.isValid) {
      return baseValidation;
    }

    // Add TXT-specific validation
    try {
      const buffer = await fs.readFile(filePath);

      // Check if file is completely empty - only add warning if not already added
      if (
        buffer.length === 0 &&
        !baseValidation.warnings.some(w => w.code === 'LOW_TEXT_CONTENT')
      ) {
        baseValidation.warnings.push({
          code: 'LOW_TEXT_CONTENT',
          message: 'Text file is empty',
          details: 'File contains no content',
        });
      }

      // Try basic encoding detection
      const encodingResult = this.detectEncoding(buffer);
      if (encodingResult.encoding === 'binary') {
        baseValidation.warnings.push({
          code: 'POTENTIAL_ENCODING_ISSUE',
          message: 'File may contain binary content',
          details: 'File appears to contain binary data rather than text',
        });
      }

      // Check for very large files that might cause performance issues
      if (buffer.length > 5 * 1024 * 1024) {
        // 5MB
        baseValidation.warnings.push({
          code: 'LARGE_FILE_SIZE',
          message: 'Large text file detected',
          details: `File size: ${this.formatFileSize(buffer.length)}`,
        });
      }
    } catch (error) {
      // File reading error already handled by base validation
    }

    return baseValidation;
  }
}
