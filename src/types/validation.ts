/**
 * Validation utilities and type guards
 * Requirements: 1.4, 2.3, 7.4
 */

import { 
  Script, 
  ScriptMetadata, 
  ScriptEvaluation, 
  FileType,
  ScriptStatus 
} from './script';
import { 
  ScriptSummary, 
  Character, 
  ProductionNote, 
  CharacterImportance,
  ProductionCategory,
  Priority,
  BudgetCategory 
} from './summary';
import { 
  AppSettings, 
  LLMSettings, 
  UISettings,
  Theme,
  LibraryView,
  SortOption,
  SortDirection 
} from './settings';
import { 
  SummaryOptions, 
  LLMModel, 
  SummaryLength, 
  FocusArea 
} from './llm-service';

/**
 * Validation result interface
 */
export interface ValidationResult<T = unknown> {
  /** Whether the validation passed */
  isValid: boolean;
  
  /** The validated data (if valid) */
  data?: T;
  
  /** Validation errors */
  errors: ValidationError[];
  
  /** Validation warnings */
  warnings: ValidationWarning[];
}

export interface ValidationError {
  /** Field path that failed validation */
  field: string;
  
  /** Error code for programmatic handling */
  code: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Current invalid value */
  value: unknown;
  
  /** Expected value type or format */
  expected?: string;
}

export interface ValidationWarning {
  /** Field path that triggered the warning */
  field: string;
  
  /** Warning code for programmatic handling */
  code: string;
  
  /** Human-readable warning message */
  message: string;
  
  /** Current value that triggered the warning */
  value: unknown;
}

/**
 * Type guard functions
 */
export const isFileType = (value: unknown): value is FileType => {
  return typeof value === 'string' && ['pdf', 'docx', 'txt'].includes(value);
};

export const isScriptStatus = (value: unknown): value is ScriptStatus => {
  return typeof value === 'string' && 
    ['uploaded', 'processing', 'analyzed', 'error'].includes(value);
};

export const isCharacterImportance = (value: unknown): value is CharacterImportance => {
  return typeof value === 'string' && 
    ['protagonist', 'main', 'supporting', 'minor'].includes(value);
};

export const isProductionCategory = (value: unknown): value is ProductionCategory => {
  return typeof value === 'string' && 
    ['budget', 'location', 'cast', 'technical', 'legal', 'scheduling', 'equipment', 'post-production'].includes(value);
};

export const isPriority = (value: unknown): value is Priority => {
  return typeof value === 'string' && 
    ['critical', 'high', 'medium', 'low'].includes(value);
};

export const isBudgetCategory = (value: unknown): value is BudgetCategory => {
  return typeof value === 'string' && 
    ['micro', 'low', 'medium', 'high', 'blockbuster'].includes(value);
};

export const isSummaryLength = (value: unknown): value is SummaryLength => {
  return typeof value === 'string' && 
    ['brief', 'standard', 'detailed', 'comprehensive'].includes(value);
};

export const isFocusArea = (value: unknown): value is FocusArea => {
  return typeof value === 'string' && 
    ['plot', 'characters', 'themes', 'dialogue', 'structure', 'genre', 'production', 'marketability', 'technical', 'legal'].includes(value);
};

export const isTheme = (value: unknown): value is Theme => {
  return typeof value === 'string' && ['dark', 'light', 'system'].includes(value);
};

export const isLibraryView = (value: unknown): value is LibraryView => {
  return typeof value === 'string' && ['grid', 'list', 'compact'].includes(value);
};

export const isSortOption = (value: unknown): value is SortOption => {
  return typeof value === 'string' && 
    ['title', 'dateAdded', 'dateModified', 'fileSize', 'wordCount', 'rating'].includes(value);
};

export const isSortDirection = (value: unknown): value is SortDirection => {
  return typeof value === 'string' && ['asc', 'desc'].includes(value);
};

/**
 * Validation functions
 */
export const validateScript = (data: unknown): ValidationResult<Script> => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'root',
      code: 'INVALID_TYPE',
      message: 'Script must be an object',
      value: data,
      expected: 'object'
    });
    return { isValid: false, errors, warnings };
  }

  const script = data as Record<string, unknown>;

  // Validate required fields
  if (!script.id || typeof script.id !== 'string') {
    errors.push({
      field: 'id',
      code: 'REQUIRED_FIELD',
      message: 'Script ID is required and must be a string',
      value: script.id,
      expected: 'string'
    });
  }

  if (!script.title || typeof script.title !== 'string') {
    errors.push({
      field: 'title',
      code: 'REQUIRED_FIELD',
      message: 'Script title is required and must be a string',
      value: script.title,
      expected: 'string'
    });
  }

  if (!script.filePath || typeof script.filePath !== 'string') {
    errors.push({
      field: 'filePath',
      code: 'REQUIRED_FIELD',
      message: 'Script file path is required and must be a string',
      value: script.filePath,
      expected: 'string'
    });
  }

  if (!script.contentHash || typeof script.contentHash !== 'string') {
    errors.push({
      field: 'contentHash',
      code: 'REQUIRED_FIELD',
      message: 'Script content hash is required and must be a string',
      value: script.contentHash,
      expected: 'string'
    });
  }

  if (typeof script.wordCount !== 'number' || script.wordCount < 0) {
    errors.push({
      field: 'wordCount',
      code: 'INVALID_VALUE',
      message: 'Word count must be a non-negative number',
      value: script.wordCount,
      expected: 'number >= 0'
    });
  }

  if (typeof script.fileSize !== 'number' || script.fileSize < 0) {
    errors.push({
      field: 'fileSize',
      code: 'INVALID_VALUE',
      message: 'File size must be a non-negative number',
      value: script.fileSize,
      expected: 'number >= 0'
    });
  }

  if (!isFileType(script.fileType)) {
    errors.push({
      field: 'fileType',
      code: 'INVALID_VALUE',
      message: 'File type must be one of: pdf, docx, txt',
      value: script.fileType,
      expected: 'pdf | docx | txt'
    });
  }

  // Validate dates
  const dateFields = ['uploadedAt', 'lastModified', 'updatedAt'];
  dateFields.forEach(field => {
    if (script[field] && !(script[field] instanceof Date)) {
      errors.push({
        field,
        code: 'INVALID_TYPE',
        message: `${field} must be a Date object`,
        value: script[field],
        expected: 'Date'
      });
    }
  });

  // Warnings for large files
  if (typeof script.fileSize === 'number' && script.fileSize > 50 * 1024 * 1024) {
    warnings.push({
      field: 'fileSize',
      code: 'LARGE_FILE',
      message: 'File size is larger than 50MB, processing may be slow',
      value: script.fileSize
    });
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? script as Script : undefined,
    errors,
    warnings
  };
};

export const validateCharacter = (data: unknown): ValidationResult<Character> => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'root',
      code: 'INVALID_TYPE',
      message: 'Character must be an object',
      value: data,
      expected: 'object'
    });
    return { isValid: false, errors, warnings };
  }

  const character = data as Record<string, unknown>;

  if (!character.name || typeof character.name !== 'string') {
    errors.push({
      field: 'name',
      code: 'REQUIRED_FIELD',
      message: 'Character name is required and must be a string',
      value: character.name,
      expected: 'string'
    });
  }

  if (!character.description || typeof character.description !== 'string') {
    errors.push({
      field: 'description',
      code: 'REQUIRED_FIELD',
      message: 'Character description is required and must be a string',
      value: character.description,
      expected: 'string'
    });
  }

  if (!isCharacterImportance(character.importance)) {
    errors.push({
      field: 'importance',
      code: 'INVALID_VALUE',
      message: 'Character importance must be one of: protagonist, main, supporting, minor',
      value: character.importance,
      expected: 'protagonist | main | supporting | minor'
    });
  }

  if (!Array.isArray(character.relationships)) {
    errors.push({
      field: 'relationships',
      code: 'INVALID_TYPE',
      message: 'Character relationships must be an array of strings',
      value: character.relationships,
      expected: 'string[]'
    });
  } else {
    character.relationships.forEach((rel, index) => {
      if (typeof rel !== 'string') {
        errors.push({
          field: `relationships[${index}]`,
          code: 'INVALID_TYPE',
          message: 'Each relationship must be a string',
          value: rel,
          expected: 'string'
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? character as Character : undefined,
    errors,
    warnings
  };
};

export const validateSummaryOptions = (data: unknown): ValidationResult<SummaryOptions> => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'root',
      code: 'INVALID_TYPE',
      message: 'Summary options must be an object',
      value: data,
      expected: 'object'
    });
    return { isValid: false, errors, warnings };
  }

  const options = data as Record<string, unknown>;

  if (!isSummaryLength(options.length)) {
    errors.push({
      field: 'length',
      code: 'INVALID_VALUE',
      message: 'Summary length must be one of: brief, standard, detailed, comprehensive',
      value: options.length,
      expected: 'brief | standard | detailed | comprehensive'
    });
  }

  if (!Array.isArray(options.focusAreas)) {
    errors.push({
      field: 'focusAreas',
      code: 'INVALID_TYPE',
      message: 'Focus areas must be an array',
      value: options.focusAreas,
      expected: 'FocusArea[]'
    });
  } else {
    options.focusAreas.forEach((area, index) => {
      if (!isFocusArea(area)) {
        errors.push({
          field: `focusAreas[${index}]`,
          code: 'INVALID_VALUE',
          message: 'Invalid focus area',
          value: area,
          expected: 'plot | characters | themes | dialogue | structure | genre | production | marketability | technical | legal'
        });
      }
    });
  }

  // Validate boolean fields
  const booleanFields = [
    'includeProductionNotes',
    'analyzeCharacterRelationships',
    'identifyThemes',
    'assessMarketability'
  ];

  booleanFields.forEach(field => {
    if (options[field] !== undefined && typeof options[field] !== 'boolean') {
      errors.push({
        field,
        code: 'INVALID_TYPE',
        message: `${field} must be a boolean`,
        value: options[field],
        expected: 'boolean'
      });
    }
  });

  // Validate optional numeric fields
  if (options.temperature !== undefined) {
    if (typeof options.temperature !== 'number' || options.temperature < 0 || options.temperature > 1) {
      errors.push({
        field: 'temperature',
        code: 'INVALID_VALUE',
        message: 'Temperature must be a number between 0 and 1',
        value: options.temperature,
        expected: 'number (0-1)'
      });
    }
  }

  if (options.maxTokens !== undefined) {
    if (typeof options.maxTokens !== 'number' || options.maxTokens < 1) {
      errors.push({
        field: 'maxTokens',
        code: 'INVALID_VALUE',
        message: 'Max tokens must be a positive number',
        value: options.maxTokens,
        expected: 'number > 0'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? options as SummaryOptions : undefined,
    errors,
    warnings
  };
};

/**
 * Utility functions for common validations
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidFilePath = (path: string): boolean => {
  return typeof path === 'string' && path.length > 0 && !path.includes('\0');
};

export const isValidId = (id: string): boolean => {
  return typeof id === 'string' && id.length > 0 && /^[a-zA-Z0-9_-]+$/.test(id);
};

export const sanitizeString = (input: string): string => {
  return input.replace(/[<>\"'&]/g, '');
};

export const validateRange = (value: number, min: number, max: number): boolean => {
  return typeof value === 'number' && value >= min && value <= max;
};