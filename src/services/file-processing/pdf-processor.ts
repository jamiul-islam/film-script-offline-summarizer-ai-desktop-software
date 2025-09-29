/**
 * PDF file processor implementation
 * Requirements: 2.1, 2.2
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import { BaseFileProcessor } from './base-processor';
import { ParsedScript, ValidationResult } from '../../types/file-processing';
import { FileType } from '../../types/script';

export class PdfProcessor extends BaseFileProcessor {
  constructor() {
    super(['.pdf'], 50 * 1024 * 1024); // 50MB max for PDFs
  }

  async parseFile(filePath: string, fileType: FileType): Promise<ParsedScript> {
    try {
      // First validate the file
      const validation = await this.validateFile(filePath);
      if (!validation.isValid) {
        throw new Error(`PDF validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Read the PDF file
      const buffer = await fs.readFile(filePath);
      
      // Parse PDF content
      const pdfData = await this.parsePdfBuffer(buffer);
      
      // Extract metadata
      const fileName = path.basename(filePath, path.extname(filePath));
      const title = pdfData.info?.Title || this.extractTitleFromContent(pdfData.text, fileName);
      
      // Create additional metadata specific to PDF
      const additionalMetadata = {
        pageCount: pdfData.numpages,
        pdfVersion: pdfData.version,
        producer: pdfData.info?.Producer,
        creator: pdfData.info?.Creator,
        creationDate: pdfData.info?.CreationDate,
        modificationDate: pdfData.info?.ModDate,
        title: pdfData.info?.Title,
        author: pdfData.info?.Author,
        subject: pdfData.info?.Subject,
        keywords: pdfData.info?.Keywords
      };

      // Create script metadata
      const metadata = this.createScriptMetadata(
        title,
        pdfData.text,
        validation.fileSize,
        additionalMetadata
      );

      // Add author from PDF metadata if available
      if (pdfData.info?.Author) {
        metadata.author = pdfData.info.Author;
      }

      // Add page count
      metadata.pageCount = pdfData.numpages;

      // Validate content and collect warnings
      const contentWarnings = await this.validateFileContent(pdfData.text);
      const warnings: string[] = [];

      // Add PDF-specific warnings
      if (pdfData.numpages === 0) {
        warnings.push('PDF appears to have no pages');
      }

      if (pdfData.text.trim().length === 0) {
        warnings.push('No text content extracted from PDF - may be image-based or corrupted');
      }

      if (pdfData.text.length < 100 && pdfData.numpages > 1) {
        warnings.push('Very little text extracted relative to page count - PDF may contain mostly images');
      }

      // Add content validation warnings
      contentWarnings.forEach(warning => {
        warnings.push(`${warning.code}: ${warning.message}`);
      });

      return {
        content: pdfData.text,
        title,
        metadata,
        warnings: warnings.length > 0 ? warnings : undefined,
        confidence: this.calculateConfidence(pdfData, validation.fileSize)
      };

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse PDF file: ${error.message}`);
      }
      throw new Error('Failed to parse PDF file: Unknown error');
    }
  }

  private async parsePdfBuffer(buffer: Buffer): Promise<any> {
    try {
      return await pdfParse(buffer, {
        // PDF parsing options
        max: 0, // Parse all pages
        version: 'v1.10.100' // Specify pdf2pic version if needed
      });
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific PDF parsing errors
        if (error.message.includes('Invalid PDF')) {
          throw new Error('File is not a valid PDF or is corrupted');
        }
        if (error.message.includes('Password')) {
          throw new Error('PDF is password protected and cannot be processed');
        }
        if (error.message.includes('Encrypted')) {
          throw new Error('PDF is encrypted and cannot be processed');
        }
        throw new Error(`PDF parsing error: ${error.message}`);
      }
      throw new Error('Unknown PDF parsing error');
    }
  }

  private calculateConfidence(pdfData: any, fileSize: number): number {
    let confidence = 1.0;

    // Reduce confidence for empty or very short content
    if (pdfData.text.trim().length === 0) {
      confidence = 0.1;
    } else if (pdfData.text.trim().length < 100) {
      confidence = 0.3;
    }

    // Reduce confidence if text-to-file-size ratio is very low (might be image-heavy)
    const textToSizeRatio = pdfData.text.length / fileSize;
    if (textToSizeRatio < 0.001) { // Less than 0.1% text
      confidence *= 0.5;
    }

    // Reduce confidence for PDFs with no pages (shouldn't happen but just in case)
    if (pdfData.numpages === 0) {
      confidence = 0.1;
    }

    // Reduce confidence if there are many pages but very little text
    if (pdfData.numpages > 10 && pdfData.text.length < 1000) {
      confidence *= 0.4;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  async validateFile(filePath: string): Promise<ValidationResult> {
    // Get base validation
    const baseValidation = await super.validateFile(filePath);
    
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    // Add PDF-specific validation
    try {
      const buffer = await fs.readFile(filePath);
      
      // Check PDF magic number
      if (!this.isPdfFile(buffer)) {
        baseValidation.errors.push({
          code: 'CORRUPTED_FILE',
          message: 'File does not appear to be a valid PDF',
          details: 'PDF magic number not found in file header',
          suggestions: [
            'Ensure the file is a valid PDF',
            'Try opening the file in a PDF viewer to verify it works',
            'Re-export or re-save the PDF if possible'
          ]
        });
        baseValidation.isValid = false;
      }

      // Try a quick parse to check for corruption
      try {
        await pdfParse(buffer.slice(0, Math.min(buffer.length, 1024 * 1024))); // Parse first 1MB for validation
      } catch (parseError) {
        if (parseError instanceof Error) {
          if (parseError.message.includes('Password') || parseError.message.includes('Encrypted')) {
            baseValidation.errors.push({
              code: 'CORRUPTED_FILE',
              message: 'PDF is password protected or encrypted',
              details: parseError.message,
              suggestions: [
                'Remove password protection from the PDF',
                'Use an unencrypted version of the PDF'
              ]
            });
          } else {
            baseValidation.errors.push({
              code: 'CORRUPTED_FILE',
              message: 'PDF appears to be corrupted or invalid',
              details: parseError.message,
              suggestions: [
                'Try opening the file in a PDF viewer to verify it works',
                'Re-export or re-save the PDF if possible',
                'Use a different PDF file'
              ]
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

  private isPdfFile(buffer: Buffer): boolean {
    // Check for PDF magic number: %PDF-
    const pdfMagic = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D]); // %PDF-
    return buffer.length >= 5 && buffer.subarray(0, 5).equals(pdfMagic);
  }
}