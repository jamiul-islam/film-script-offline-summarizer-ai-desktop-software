/**
 * IPC handlers for main process communication
 * Requirements: 1.1, 2.1, 3.2, 6.1
 */

import { ipcMain, dialog, BrowserWindow } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileProcessorFactory } from '../services/file-processing';
import { OllamaService } from '../services/llm';
import { getDatabaseManager } from '../database';
import type { 
  ParsedScript, 
  ValidationResult, 
  FileProcessingOptions 
} from '../types/file-processing';
import type { 
  ScriptSummary, 
  SummaryOptions, 
  LLMModel,
  ServiceStatus 
} from '../types/llm-service';
import type { 
  DatabaseScript, 
  DatabaseSummary, 
  DatabaseScriptEvaluation 
} from '../types';

// Security: Allowed file extensions
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Validates file path for security
 */
function validateFilePath(filePath: string): boolean {
  try {
    const resolvedPath = path.resolve(filePath);
    const extension = path.extname(resolvedPath).toLowerCase();
    
    // Check if extension is allowed
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return false;
    }
    
    // Prevent path traversal attacks
    if (resolvedPath.includes('..') || resolvedPath.includes('~')) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates file size
 */
async function validateFileSize(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size <= MAX_FILE_SIZE;
  } catch {
    return false;
  }
}

/**
 * File upload and processing handlers
 */
export function registerFileHandlers(): void {
  // Handle file dialog opening
  ipcMain.handle('file:open-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Script Files', extensions: ['pdf', 'docx', 'txt'] },
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'Word Documents', extensions: ['docx'] },
        { name: 'Text Files', extensions: ['txt'] }
      ]
    });
    
    return result;
  });

  // Handle file validation
  ipcMain.handle('file:validate', async (_, filePath: string): Promise<ValidationResult> => {
    try {
      // Security validation
      if (!validateFilePath(filePath)) {
        return {
          isValid: false,
          errors: [{
            code: 'UNSUPPORTED_FORMAT',
            message: 'File type not allowed or invalid path',
            suggestions: ['Please select a PDF, DOCX, or TXT file']
          }],
          warnings: [],
          fileSize: 0,
          isReadable: false
        };
      }

      // Size validation
      if (!(await validateFileSize(filePath))) {
        return {
          isValid: false,
          errors: [{
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds maximum allowed size',
            suggestions: ['Please select a file smaller than 50MB']
          }],
          warnings: [],
          fileSize: 0,
          isReadable: false
        };
      }

      // Use file processor for detailed validation
      const extension = path.extname(filePath).toLowerCase();
      const fileType = extension.slice(1) as 'pdf' | 'docx' | 'txt';
      const processor = fileProcessorFactory.createProcessor(fileType);
      
      return await processor.validateFile(filePath);
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          code: 'FILE_NOT_READABLE',
          message: 'Unable to access file',
          details: error instanceof Error ? error.message : 'Unknown error'
        }],
        warnings: [],
        fileSize: 0,
        isReadable: false
      };
    }
  });

  // Handle file processing
  ipcMain.handle('file:process', async (
    _, 
    filePath: string, 
    options?: FileProcessingOptions
  ): Promise<ParsedScript> => {
    try {
      // Security validation
      if (!validateFilePath(filePath)) {
        throw new Error('Invalid file path or unsupported file type');
      }

      if (!(await validateFileSize(filePath))) {
        throw new Error('File size exceeds maximum allowed size');
      }

      const extension = path.extname(filePath).toLowerCase();
      const fileType = extension.slice(1) as 'pdf' | 'docx' | 'txt';
      const processor = fileProcessorFactory.createProcessor(fileType);
      
      return await processor.parseFile(filePath, fileType);
    } catch (error) {
      throw new Error(`File processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}/**
 * 
LLM service handlers
 */
export function registerLLMHandlers(): void {
  const llmService = new OllamaService();
  
  // Set default model if available
  const defaultModel = process.env.DEFAULT_MODEL || 'gemma3:1b';
  llmService.setActiveModel(defaultModel).catch(error => {
    console.warn('Failed to set default model:', error);
  });

  // Check LLM availability
  ipcMain.handle('llm:is-available', async (): Promise<boolean> => {
    try {
      return await llmService.isAvailable();
    } catch (error) {
      console.error('LLM availability check failed:', error);
      return false;
    }
  });

  // Get service status
  ipcMain.handle('llm:get-status', async (): Promise<ServiceStatus> => {
    try {
      return await llmService.getServiceStatus();
    } catch (error) {
      throw new Error(`Failed to get LLM status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // List available models
  ipcMain.handle('llm:list-models', async (): Promise<LLMModel[]> => {
    try {
      return await llmService.listAvailableModels();
    } catch (error) {
      throw new Error(`Failed to list models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Get current model
  ipcMain.handle('llm:get-current-model', async (): Promise<LLMModel | null> => {
    try {
      return await llmService.getCurrentModel();
    } catch (error) {
      console.error('Failed to get current model:', error);
      return null;
    }
  });

  // Set active model
  ipcMain.handle('llm:set-model', async (_, modelId: string): Promise<void> => {
    try {
      await llmService.setActiveModel(modelId);
    } catch (error) {
      throw new Error(`Failed to set model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Test model
  ipcMain.handle('llm:test-model', async (_, modelId: string) => {
    try {
      return await llmService.testModel(modelId);
    } catch (error) {
      throw new Error(`Model test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Generate summary
  ipcMain.handle('llm:generate-summary', async (
    _, 
    content: string, 
    options: SummaryOptions
  ): Promise<ScriptSummary> => {
    try {
      return await llmService.generateSummary(content, options);
    } catch (error) {
      throw new Error(`Summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Cancel generation
  ipcMain.handle('llm:cancel-generation', async (_, operationId: string): Promise<void> => {
    try {
      await llmService.cancelGeneration(operationId);
    } catch (error) {
      console.error('Failed to cancel generation:', error);
      // Don't throw here as cancellation might fail if operation already completed
    }
  });
}

/**
 * Database operation handlers
 */
export function registerDatabaseHandlers(): void {
  // Save script
  ipcMain.handle('db:save-script', async (_, scriptData: Omit<DatabaseScript, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseScript> => {
    try {
      const db = getDatabaseManager();
      return await db.saveScript(scriptData);
    } catch (error) {
      throw new Error(`Failed to save script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Get script by ID
  ipcMain.handle('db:get-script', async (_, scriptId: string): Promise<DatabaseScript | null> => {
    try {
      const db = getDatabaseManager();
      return await db.getScript(scriptId);
    } catch (error) {
      console.error('Failed to get script:', error);
      return null;
    }
  });

  // Get all scripts
  ipcMain.handle('db:get-all-scripts', async (): Promise<DatabaseScript[]> => {
    try {
      const db = getDatabaseManager();
      return await db.getAllScripts();
    } catch (error) {
      throw new Error(`Failed to get scripts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Update script
  ipcMain.handle('db:update-script', async (_, scriptId: string, updates: Partial<DatabaseScript>): Promise<DatabaseScript> => {
    try {
      const db = getDatabaseManager();
      return await db.updateScript(scriptId, updates);
    } catch (error) {
      throw new Error(`Failed to update script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Delete script
  ipcMain.handle('db:delete-script', async (_, scriptId: string): Promise<void> => {
    try {
      const db = getDatabaseManager();
      await db.deleteScript(scriptId);
    } catch (error) {
      throw new Error(`Failed to delete script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Save summary
  ipcMain.handle('db:save-summary', async (_, summaryData: Omit<DatabaseSummary, 'id' | 'createdAt'>): Promise<DatabaseSummary> => {
    try {
      const db = getDatabaseManager();
      return await db.saveSummary(summaryData);
    } catch (error) {
      throw new Error(`Failed to save summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Get summary by script ID
  ipcMain.handle('db:get-summary', async (_, scriptId: string): Promise<DatabaseSummary | null> => {
    try {
      const db = getDatabaseManager();
      return await db.getSummaryByScriptId(scriptId);
    } catch (error) {
      console.error('Failed to get summary:', error);
      return null;
    }
  });

  // Save script evaluation
  ipcMain.handle('db:save-evaluation', async (_, evaluationData: Omit<DatabaseScriptEvaluation, 'id' | 'createdAt'>): Promise<DatabaseScriptEvaluation> => {
    try {
      const db = getDatabaseManager();
      return await db.saveEvaluation(evaluationData);
    } catch (error) {
      throw new Error(`Failed to save evaluation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Get evaluation by script ID
  ipcMain.handle('db:get-evaluation', async (_, scriptId: string): Promise<DatabaseScriptEvaluation | null> => {
    try {
      const db = getDatabaseManager();
      return await db.getEvaluationByScriptId(scriptId);
    } catch (error) {
      console.error('Failed to get evaluation:', error);
      return null;
    }
  });

  // Search scripts
  ipcMain.handle('db:search-scripts', async (_, query: string): Promise<DatabaseScript[]> => {
    try {
      const db = getDatabaseManager();
      return await db.searchScripts(query);
    } catch (error) {
      throw new Error(`Failed to search scripts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

/**
 * Initialize all IPC handlers
 */
export function initializeIPCHandlers(): void {
  registerFileHandlers();
  registerLLMHandlers();
  registerDatabaseHandlers();
}

/**
 * Clean up IPC handlers
 */
export function cleanupIPCHandlers(): void {
  // Remove all listeners to prevent memory leaks
  ipcMain.removeAllListeners('file:open-dialog');
  ipcMain.removeAllListeners('file:validate');
  ipcMain.removeAllListeners('file:process');
  
  ipcMain.removeAllListeners('llm:is-available');
  ipcMain.removeAllListeners('llm:get-status');
  ipcMain.removeAllListeners('llm:list-models');
  ipcMain.removeAllListeners('llm:get-current-model');
  ipcMain.removeAllListeners('llm:set-model');
  ipcMain.removeAllListeners('llm:test-model');
  ipcMain.removeAllListeners('llm:generate-summary');
  ipcMain.removeAllListeners('llm:cancel-generation');
  
  ipcMain.removeAllListeners('db:save-script');
  ipcMain.removeAllListeners('db:get-script');
  ipcMain.removeAllListeners('db:get-all-scripts');
  ipcMain.removeAllListeners('db:update-script');
  ipcMain.removeAllListeners('db:delete-script');
  ipcMain.removeAllListeners('db:save-summary');
  ipcMain.removeAllListeners('db:get-summary');
  ipcMain.removeAllListeners('db:save-evaluation');
  ipcMain.removeAllListeners('db:get-evaluation');
  ipcMain.removeAllListeners('db:search-scripts');
}