/**
 * Application settings and configuration types
 * Requirements: 5.1, 5.4, 7.1, 7.2, 7.3, 7.5
 */

import { SummaryLength, FocusArea } from './llm-service';

export interface AppSettings {
  /** LLM configuration settings */
  llm: LLMSettings;
  
  /** User interface preferences */
  ui: UISettings;
  
  /** File processing preferences */
  fileProcessing: FileProcessingSettings;
  
  /** Data management settings */
  data: DataSettings;
  
  /** Performance and optimization settings */
  performance: PerformanceSettings;
  
  /** Privacy and security settings */
  privacy: PrivacySettings;
  
  /** When settings were last updated */
  lastUpdated: Date;
  
  /** Settings version for migration purposes */
  version: string;
}

export interface LLMSettings {
  /** Currently selected LLM model ID */
  selectedModel: string;
  
  /** Default summary length preference */
  defaultSummaryLength: SummaryLength;
  
  /** Default focus areas for analysis */
  defaultFocusAreas: FocusArea[];
  
  /** Default temperature setting (0-1) */
  defaultTemperature: number;
  
  /** Default maximum tokens */
  defaultMaxTokens: number;
  
  /** Whether to include production notes by default */
  includeProductionNotesByDefault: boolean;
  
  /** Whether to analyze character relationships by default */
  analyzeCharacterRelationshipsByDefault: boolean;
  
  /** Whether to identify themes by default */
  identifyThemesByDefault: boolean;
  
  /** Whether to assess marketability by default */
  assessMarketabilityByDefault: boolean;
  
  /** Custom default instructions */
  defaultCustomInstructions?: string;
  
  /** Timeout for LLM operations in milliseconds */
  operationTimeout: number;
  
  /** Whether to auto-retry failed operations */
  autoRetryFailedOperations: boolean;
  
  /** Maximum number of retry attempts */
  maxRetryAttempts: number;
}

export interface UISettings {
  /** Theme preference */
  theme: Theme;
  
  /** Whether to enable UI animations */
  enableAnimations: boolean;
  
  /** Animation speed multiplier (0.5-2.0) */
  animationSpeed: number;
  
  /** Preferred view mode for script library */
  defaultLibraryView: LibraryView;
  
  /** Number of scripts to show per page */
  scriptsPerPage: number;
  
  /** Default sorting option for scripts */
  defaultSortBy: SortOption;
  
  /** Default sort direction */
  defaultSortDirection: SortDirection;
  
  /** Whether to show file size in library */
  showFileSizeInLibrary: boolean;
  
  /** Whether to show word count in library */
  showWordCountInLibrary: boolean;
  
  /** Whether to auto-expand summary sections */
  autoExpandSummarySections: boolean;
  
  /** Preferred export format */
  defaultExportFormat: ExportFormat;
  
  /** Window size and position preferences */
  windowPreferences: WindowPreferences;
}

export interface FileProcessingSettings {
  /** Maximum file size to accept in MB */
  maxFileSizeMB: number;
  
  /** Whether to validate file content */
  validateFileContent: boolean;
  
  /** Whether to extract metadata automatically */
  autoExtractMetadata: boolean;
  
  /** Default text encoding */
  defaultEncoding: string;
  
  /** Processing timeout in milliseconds */
  processingTimeout: number;
  
  /** Whether to create backups of processed files */
  createFileBackups: boolean;
  
  /** Backup retention period in days */
  backupRetentionDays: number;
}

export interface DataSettings {
  /** Whether to enable auto-save */
  autoSave: boolean;
  
  /** Auto-save interval in milliseconds */
  autoSaveInterval: number;
  
  /** Whether to create automatic backups */
  autoBackup: boolean;
  
  /** Backup frequency in hours */
  backupFrequencyHours: number;
  
  /** Maximum number of backups to keep */
  maxBackupsToKeep: number;
  
  /** Whether to compress backups */
  compressBackups: boolean;
  
  /** Data retention period in days (0 = keep forever) */
  dataRetentionDays: number;
  
  /** Whether to export data on app close */
  exportOnClose: boolean;
}

export interface PerformanceSettings {
  /** Maximum concurrent file processing operations */
  maxConcurrentProcessing: number;
  
  /** Memory usage limit in MB */
  memoryLimitMB: number;
  
  /** Whether to enable performance monitoring */
  enablePerformanceMonitoring: boolean;
  
  /** Whether to optimize for battery life */
  optimizeForBattery: boolean;
  
  /** Whether to use hardware acceleration when available */
  useHardwareAcceleration: boolean;
  
  /** Cache size limit in MB */
  cacheSizeLimitMB: number;
  
  /** Whether to preload frequently used data */
  preloadFrequentData: boolean;
}

export interface PrivacySettings {
  /** Whether to collect anonymous usage statistics */
  collectUsageStatistics: boolean;
  
  /** Whether to check for updates automatically */
  autoCheckUpdates: boolean;
  
  /** Whether to send crash reports */
  sendCrashReports: boolean;
  
  /** Data sharing preferences */
  dataSharing: DataSharingLevel;
  
  /** Whether to clear temporary files on exit */
  clearTempFilesOnExit: boolean;
  
  /** Whether to encrypt local data */
  encryptLocalData: boolean;
}

export interface WindowPreferences {
  /** Window width */
  width: number;
  
  /** Window height */
  height: number;
  
  /** Window x position */
  x?: number;
  
  /** Window y position */
  y?: number;
  
  /** Whether window is maximized */
  isMaximized: boolean;
  
  /** Whether window is in fullscreen */
  isFullscreen: boolean;
  
  /** Sidebar width */
  sidebarWidth: number;
  
  /** Whether sidebar is collapsed */
  sidebarCollapsed: boolean;
}

export type Theme = 'dark' | 'light' | 'system';

export type LibraryView = 'grid' | 'list' | 'compact';

export type SortOption = 
  | 'title' 
  | 'dateAdded' 
  | 'dateModified' 
  | 'fileSize' 
  | 'wordCount' 
  | 'rating';

export type SortDirection = 'asc' | 'desc';

export type ExportFormat = 'pdf' | 'txt' | 'json' | 'csv';

export type DataSharingLevel = 'none' | 'minimal' | 'standard' | 'full';

export interface SettingsValidation {
  /** Whether the settings are valid */
  isValid: boolean;
  
  /** Validation errors */
  errors: SettingsError[];
  
  /** Validation warnings */
  warnings: SettingsWarning[];
}

export interface SettingsError {
  /** Settings key that has the error */
  key: string;
  
  /** Error message */
  message: string;
  
  /** Current invalid value */
  currentValue: unknown;
  
  /** Suggested valid value */
  suggestedValue?: unknown;
}

export interface SettingsWarning {
  /** Settings key that has the warning */
  key: string;
  
  /** Warning message */
  message: string;
  
  /** Current value that triggered the warning */
  currentValue: unknown;
}