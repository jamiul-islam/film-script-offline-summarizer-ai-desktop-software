/**
 * File processor factory for creating appropriate processors
 * Requirements: 2.1, 2.3
 */

import {
  FileProcessor,
  FileProcessorFactory,
} from '../../types/file-processing';
import { FileType } from '../../types/script';
import { PdfProcessor } from './pdf-processor';
import { DocxProcessor } from './docx-processor';
import { TxtProcessor } from './txt-processor';

export class FileProcessorFactoryImpl implements FileProcessorFactory {
  private processors: Map<FileType, FileProcessor>;

  constructor() {
    this.processors = new Map();
    this.initializeProcessors();
  }

  private initializeProcessors(): void {
    this.processors.set('pdf', new PdfProcessor());
    this.processors.set('docx', new DocxProcessor());
    this.processors.set('txt', new TxtProcessor());
  }

  createProcessor(fileType: FileType): FileProcessor {
    const processor = this.processors.get(fileType);

    if (!processor) {
      throw new Error(`No processor available for file type: ${fileType}`);
    }

    return processor;
  }

  getAvailableProcessors(): Map<FileType, FileProcessor> {
    return new Map(this.processors);
  }

  /**
   * Get a processor based on file extension
   */
  createProcessorByExtension(extension: string): FileProcessor {
    const normalizedExt = extension.toLowerCase().replace('.', '');

    switch (normalizedExt) {
      case 'pdf':
        return this.createProcessor('pdf');
      case 'docx':
      case 'doc':
        return this.createProcessor('docx');
      case 'txt':
      case 'text':
        return this.createProcessor('txt');
      default:
        throw new Error(`Unsupported file extension: ${extension}`);
    }
  }

  /**
   * Check if a file extension is supported
   */
  isExtensionSupported(extension: string): boolean {
    try {
      this.createProcessorByExtension(extension);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all supported file extensions
   */
  getSupportedExtensions(): string[] {
    const extensions: string[] = [];

    for (const processor of this.processors.values()) {
      extensions.push(...processor.getSupportedExtensions());
    }

    return [...new Set(extensions)]; // Remove duplicates
  }
}

// Export singleton instance
export const fileProcessorFactory = new FileProcessorFactoryImpl();
