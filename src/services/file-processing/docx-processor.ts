/**
 * DOCX file processor implementation
 * Requirements: 2.1, 2.2
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as mammoth from 'mammoth';
import { BaseFileProcessor } from './base-processor';
import { ParsedScript, ValidationResult } from '../../types/file-processing';
import { FileType } from '../../types/script';

export class DocxProcessor extends BaseFileProcessor {
  constructor() {
    super(['.docx', '.doc'], 25 * 1024 * 1024); // 25MB max for DOCX files
  }

  async parseFile(filePath: string, fileType: FileType): Promise<ParsedScript> {
    try {
      // First validate the file
      const validation = await this.validateFile(filePath);
      if (!validation.isValid) {
        throw new Error(
          `DOCX validation failed: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      // Read the DOCX file
      const buffer = await fs.readFile(filePath);

      // Parse DOCX content using mammoth
      const result = await this.parseDocxBuffer(buffer);

      // Extract metadata
      const fileName = path.basename(filePath, path.extname(filePath));
      const title = this.extractTitleFromContent(result.value, fileName);

      // Create additional metadata specific to DOCX
      const additionalMetadata = {
        extractedHtml: result.value, // Store the HTML version
        conversionMessages: result.messages.map(msg => ({
          type: msg.type,
          message: msg.message,
        })),
        hasImages: result.messages.some(msg => msg.message.includes('image')),
        hasUnsupportedElements: result.messages.some(
          msg => msg.type === 'warning'
        ),
      };

      // Convert HTML to plain text for content
      const plainText = this.htmlToPlainText(result.value);

      // Create script metadata
      const metadata = this.createScriptMetadata(
        title,
        plainText,
        validation.fileSize,
        additionalMetadata
      );

      // Validate content and collect warnings
      const contentWarnings = await this.validateFileContent(plainText);
      const warnings: string[] = [];

      // Add DOCX-specific warnings
      if (plainText.trim().length === 0) {
        warnings.push(
          'No text content extracted from DOCX - file may be corrupted or contain only images'
        );
      }

      if (result.messages.length > 0) {
        const warningMessages = result.messages.filter(
          msg => msg.type === 'warning'
        );
        if (warningMessages.length > 0) {
          warnings.push(
            `Document contains ${warningMessages.length} unsupported elements that may affect formatting`
          );
        }
      }

      // Check for potential formatting issues
      if (result.value.length > plainText.length * 3) {
        warnings.push(
          'Document contains complex formatting that may not be fully preserved'
        );
      }

      // Add content validation warnings
      contentWarnings.forEach(warning => {
        warnings.push(`${warning.code}: ${warning.message}`);
      });

      return {
        content: plainText,
        title,
        metadata,
        warnings: warnings.length > 0 ? warnings : undefined,
        confidence: this.calculateConfidence(
          result,
          plainText,
          validation.fileSize
        ),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse DOCX file: ${error.message}`);
      }
      throw new Error('Failed to parse DOCX file: Unknown error');
    }
  }

  private async parseDocxBuffer(buffer: Buffer): Promise<any> {
    try {
      return await mammoth.convertToHtml(
        { buffer },
        {
          // Mammoth options for better conversion
          convertImage: mammoth.images.imgElement(function (image) {
            return image.read('base64').then(function (imageBuffer) {
              return {
                src: 'data:' + image.contentType + ';base64,' + imageBuffer,
              };
            });
          }),
          includeDefaultStyleMap: true,
          includeEmbeddedStyleMap: true,
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific DOCX parsing errors
        if (error.message.includes('not a valid zip file')) {
          throw new Error('File is not a valid DOCX document or is corrupted');
        }
        if (error.message.includes('password')) {
          throw new Error('DOCX is password protected and cannot be processed');
        }
        if (error.message.includes('encrypted')) {
          throw new Error('DOCX is encrypted and cannot be processed');
        }
        throw new Error(`DOCX parsing error: ${error.message}`);
      }
      throw new Error('Unknown DOCX parsing error');
    }
  }

  private htmlToPlainText(html: string): string {
    // Simple HTML to plain text conversion
    return (
      html
        // Replace paragraph tags with newlines
        .replace(/<\/p>/gi, '\n')
        .replace(/<p[^>]*>/gi, '')
        // Replace line breaks
        .replace(/<br\s*\/?>/gi, '\n')
        // Replace list items with newlines and bullets
        .replace(/<\/li>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        // Replace headings with newlines
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<h[1-6][^>]*>/gi, '')
        // Remove all other HTML tags
        .replace(/<[^>]*>/g, '')
        // Decode HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Clean up whitespace
        .replace(/\n\s*\n/g, '\n\n') // Multiple newlines to double newlines
        .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
        .trim()
    );
  }

  private calculateConfidence(
    result: any,
    plainText: string,
    fileSize: number
  ): number {
    let confidence = 1.0;

    // Reduce confidence for empty or very short content
    if (plainText.trim().length === 0) {
      confidence = 0.1;
    } else if (plainText.trim().length < 100) {
      confidence = 0.3;
    }

    // Reduce confidence based on conversion warnings
    const warningMessages = result.messages.filter(
      (msg: any) => msg.type === 'warning'
    );
    if (warningMessages.length > 0) {
      confidence *= Math.max(0.5, 1 - warningMessages.length * 0.1);
    }

    // Reduce confidence if text-to-file-size ratio is very low
    const textToSizeRatio = plainText.length / fileSize;
    if (textToSizeRatio < 0.001) {
      // Less than 0.1% text
      confidence *= 0.5;
    }

    // Reduce confidence if HTML is much larger than plain text (complex formatting)
    if (result.value.length > plainText.length * 5) {
      confidence *= 0.8;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  async validateFile(filePath: string): Promise<ValidationResult> {
    // Get base validation
    const baseValidation = await super.validateFile(filePath);

    if (!baseValidation.isValid) {
      return baseValidation;
    }

    // Add DOCX-specific validation
    try {
      const buffer = await fs.readFile(filePath);

      // Check for ZIP file signature (DOCX files are ZIP archives)
      if (!this.isDocxFile(buffer)) {
        baseValidation.errors.push({
          code: 'CORRUPTED_FILE',
          message: 'File does not appear to be a valid DOCX document',
          details: 'DOCX magic number not found in file header',
          suggestions: [
            'Ensure the file is a valid DOCX document',
            'Try opening the file in Microsoft Word to verify it works',
            'Re-save the document as DOCX if possible',
          ],
        });
        baseValidation.isValid = false;
      }

      // Try a quick parse to check for corruption
      try {
        await mammoth.convertToHtml({
          buffer: buffer.slice(0, Math.min(buffer.length, 1024 * 1024)),
        }); // Parse first 1MB for validation
      } catch (parseError) {
        if (parseError instanceof Error) {
          if (
            parseError.message.includes('password') ||
            parseError.message.includes('encrypted')
          ) {
            baseValidation.errors.push({
              code: 'CORRUPTED_FILE',
              message: 'DOCX is password protected or encrypted',
              details: parseError.message,
              suggestions: [
                'Remove password protection from the DOCX',
                'Use an unencrypted version of the DOCX',
              ],
            });
          } else {
            baseValidation.errors.push({
              code: 'CORRUPTED_FILE',
              message: 'DOCX appears to be corrupted or invalid',
              details: parseError.message,
              suggestions: [
                'Try opening the file in Microsoft Word to verify it works',
                'Re-save the document if possible',
                'Use a different DOCX file',
              ],
            });
          }
          baseValidation.isValid = false;
        }
      }
    } catch (error) {
      // File reading error already handled by base validation
    }

    return baseValidation;
  }

  private isDocxFile(buffer: Buffer): boolean {
    // Check for ZIP file signature (DOCX files are ZIP archives)
    // ZIP signature: PK (0x504B)
    if (buffer.length < 4) return false;

    const zipSignature = buffer.readUInt16LE(0);
    return zipSignature === 0x4b50; // "PK" in little-endian
  }
}
