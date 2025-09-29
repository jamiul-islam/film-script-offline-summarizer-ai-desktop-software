/**
 * File processing service exports
 * Requirements: 2.1, 2.3
 */

export { BaseFileProcessor } from './base-processor';
export {
  FileProcessorFactoryImpl,
  fileProcessorFactory,
} from './processor-factory';
export { PdfProcessor } from './pdf-processor';
export { DocxProcessor } from './docx-processor';
export { TxtProcessor } from './txt-processor';

// Re-export types for convenience
export type {
  FileProcessor,
  ParsedScript,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  FileProcessingOptions,
  ProcessingProgress,
  FileProcessorFactory,
} from '../../types/file-processing';
