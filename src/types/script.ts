/**
 * Core script-related data models
 * Requirements: 1.1, 2.1, 6.1, 6.2
 */

export interface Script {
  /** Unique identifier for the script */
  id: string;
  /** Display title of the script */
  title: string;
  /** Original file path on the system */
  filePath: string;
  /** Hash of the script content for change detection */
  contentHash: string;
  /** Total word count of the script */
  wordCount: number;
  /** File size in bytes */
  fileSize: number;
  /** Original file format */
  fileType: FileType;
  /** When the script was uploaded to the app */
  uploadedAt: Date;
  /** When the script file was last modified */
  lastModified: Date;
  /** When the script record was last updated */
  updatedAt: Date;
}

export interface ScriptMetadata {
  /** Detected or provided title */
  title: string;
  /** Author information if available */
  author?: string;
  /** Page count for formatted scripts */
  pageCount?: number;
  /** Word count */
  wordCount: number;
  /** Character count */
  characterCount: number;
  /** File size in bytes */
  fileSize: number;
  /** Creation date from file system */
  createdAt?: Date;
  /** Last modification date from file system */
  modifiedAt?: Date;
  /** Additional metadata specific to file type */
  additionalMetadata?: Record<string, unknown>;
}

export interface ScriptEvaluation {
  /** Unique identifier for the evaluation */
  id: string;
  /** Reference to the script being evaluated */
  scriptId: string;
  /** User rating from 1-5 stars */
  rating: number;
  /** User notes about the script */
  notes: string;
  /** User-defined tags for organization */
  tags: string[];
  /** When the evaluation was created */
  createdAt: Date;
  /** When the evaluation was last updated */
  updatedAt: Date;
}

export type FileType = 'pdf' | 'docx' | 'txt';

export type ScriptStatus = 'uploaded' | 'processing' | 'analyzed' | 'error';

export interface ScriptWithSummary extends Script {
  /** Associated summary if available */
  summary?: ScriptSummary;
  /** User evaluation if available */
  evaluation?: ScriptEvaluation;
  /** Current processing status */
  status: ScriptStatus;
}

// Import ScriptSummary type (will be defined in summary.ts)
export type { ScriptSummary } from './summary';