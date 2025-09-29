/**
 * File processing interfaces and types
 * Requirements: 2.1, 2.2, 2.3
 */

import { FileType, ScriptMetadata } from './script';

export interface FileProcessor {
  /** Parse a file and extract its content and metadata */
  parseFile(filePath: string, fileType: FileType): Promise<ParsedScript>;

  /** Validate a file before processing */
  validateFile(filePath: string): Promise<ValidationResult>;

  /** Get supported file extensions */
  getSupportedExtensions(): string[];

  /** Check if a file type is supported */
  isSupported(fileType: string): boolean;
}

export interface ParsedScript {
  /** Extracted text content from the file */
  content: string;

  /** Detected or provided title */
  title: string;

  /** File metadata including word count, size, etc. */
  metadata: ScriptMetadata;

  /** Processing warnings or notes */
  warnings?: string[];

  /** Confidence level of the parsing (0-1) */
  confidence?: number;
}

export interface ValidationResult {
  /** Whether the file is valid for processing */
  isValid: boolean;

  /** Error messages if validation failed */
  errors: ValidationError[];

  /** Warning messages for potential issues */
  warnings: ValidationWarning[];

  /** Detected file type */
  detectedFileType?: FileType;

  /** File size in bytes */
  fileSize: number;

  /** Whether the file is readable */
  isReadable: boolean;
}

export interface ValidationError {
  /** Error code for programmatic handling */
  code: ValidationErrorCode;

  /** Human-readable error message */
  message: string;

  /** Additional context about the error */
  details?: string;

  /** Suggested solutions */
  suggestions?: string[];
}

export interface ValidationWarning {
  /** Warning code for programmatic handling */
  code: ValidationWarningCode;

  /** Human-readable warning message */
  message: string;

  /** Additional context about the warning */
  details?: string;
}

export type ValidationErrorCode =
  | 'UNSUPPORTED_FORMAT'
  | 'FILE_TOO_LARGE'
  | 'FILE_NOT_FOUND'
  | 'FILE_NOT_READABLE'
  | 'CORRUPTED_FILE'
  | 'EMPTY_FILE'
  | 'INVALID_ENCODING'
  | 'PERMISSION_DENIED';

export type ValidationWarningCode =
  | 'LARGE_FILE_SIZE'
  | 'UNUSUAL_FORMAT'
  | 'LOW_TEXT_CONTENT'
  | 'POTENTIAL_ENCODING_ISSUE'
  | 'MISSING_METADATA';

export interface FileProcessingOptions {
  /** Maximum file size to process (in bytes) */
  maxFileSize?: number;

  /** Preferred text encoding */
  encoding?: string;

  /** Whether to extract metadata */
  extractMetadata?: boolean;

  /** Whether to perform content validation */
  validateContent?: boolean;

  /** Timeout for processing operations (in ms) */
  timeout?: number;
}

export interface ProcessingProgress {
  /** Current step in the processing pipeline */
  currentStep: ProcessingStep;

  /** Progress percentage (0-100) */
  progress: number;

  /** Current status message */
  message: string;

  /** Whether the operation can be cancelled */
  cancellable: boolean;
}

export type ProcessingStep =
  | 'validating'
  | 'reading'
  | 'parsing'
  | 'extracting_metadata'
  | 'validating_content'
  | 'complete'
  | 'error';

export interface FileProcessorFactory {
  /** Create a processor for the specified file type */
  createProcessor(fileType: FileType): FileProcessor;

  /** Get all available processors */
  getAvailableProcessors(): Map<FileType, FileProcessor>;
}
