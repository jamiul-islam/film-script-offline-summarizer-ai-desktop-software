/**
 * Preload script for secure IPC communication
 * Requirements: 1.1, 2.1, 3.2, 6.1
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { 
  ParsedScript, 
  ValidationResult, 
  FileProcessingOptions 
} from './types/file-processing';
import type { 
  ScriptSummary, 
  SummaryOptions, 
  LLMModel,
  ServiceStatus,
  ModelTestResult
} from './types/llm-service';
import type { 
  DatabaseScript, 
  DatabaseSummary, 
  DatabaseScriptEvaluation 
} from './types';

// Define the API interface that will be exposed to the renderer
export interface ElectronAPI {
  // File operations
  file: {
    openDialog: () => Promise<Electron.OpenDialogReturnValue>;
    validate: (filePath: string) => Promise<ValidationResult>;
    process: (filePath: string, options?: FileProcessingOptions) => Promise<ParsedScript>;
  };

  // LLM operations
  llm: {
    isAvailable: () => Promise<boolean>;
    getStatus: () => Promise<ServiceStatus>;
    listModels: () => Promise<LLMModel[]>;
    getCurrentModel: () => Promise<LLMModel | null>;
    setModel: (modelId: string) => Promise<void>;
    testModel: (modelId: string) => Promise<ModelTestResult>;
    generateSummary: (content: string, options: SummaryOptions) => Promise<ScriptSummary>;
    cancelGeneration: (operationId: string) => Promise<void>;
  };

  // Database operations
  db: {
    saveScript: (scriptData: Omit<DatabaseScript, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DatabaseScript>;
    getScript: (scriptId: string) => Promise<DatabaseScript | null>;
    getAllScripts: () => Promise<DatabaseScript[]>;
    updateScript: (scriptId: string, updates: Partial<DatabaseScript>) => Promise<DatabaseScript>;
    deleteScript: (scriptId: string) => Promise<void>;
    saveSummary: (summaryData: Omit<DatabaseSummary, 'id' | 'createdAt'>) => Promise<DatabaseSummary>;
    getSummary: (scriptId: string) => Promise<DatabaseSummary | null>;
    saveEvaluation: (evaluationData: Omit<DatabaseScriptEvaluation, 'id' | 'createdAt'>) => Promise<DatabaseScriptEvaluation>;
    getEvaluation: (scriptId: string) => Promise<DatabaseScriptEvaluation | null>;
    searchScripts: (query: string) => Promise<DatabaseScript[]>;
  };
}

// Expose the API to the renderer process
const electronAPI: ElectronAPI = {
  file: {
    openDialog: () => ipcRenderer.invoke('file:open-dialog'),
    validate: (filePath: string) => ipcRenderer.invoke('file:validate', filePath),
    process: (filePath: string, options?: FileProcessingOptions) => 
      ipcRenderer.invoke('file:process', filePath, options),
  },

  llm: {
    isAvailable: () => ipcRenderer.invoke('llm:is-available'),
    getStatus: () => ipcRenderer.invoke('llm:get-status'),
    listModels: () => ipcRenderer.invoke('llm:list-models'),
    getCurrentModel: () => ipcRenderer.invoke('llm:get-current-model'),
    setModel: (modelId: string) => ipcRenderer.invoke('llm:set-model', modelId),
    testModel: (modelId: string) => ipcRenderer.invoke('llm:test-model', modelId),
    generateSummary: (content: string, options: SummaryOptions) => 
      ipcRenderer.invoke('llm:generate-summary', content, options),
    cancelGeneration: (operationId: string) => 
      ipcRenderer.invoke('llm:cancel-generation', operationId),
  },

  db: {
    saveScript: (scriptData) => ipcRenderer.invoke('db:save-script', scriptData),
    getScript: (scriptId: string) => ipcRenderer.invoke('db:get-script', scriptId),
    getAllScripts: () => ipcRenderer.invoke('db:get-all-scripts'),
    updateScript: (scriptId: string, updates) => 
      ipcRenderer.invoke('db:update-script', scriptId, updates),
    deleteScript: (scriptId: string) => ipcRenderer.invoke('db:delete-script', scriptId),
    saveSummary: (summaryData) => ipcRenderer.invoke('db:save-summary', summaryData),
    getSummary: (scriptId: string) => ipcRenderer.invoke('db:get-summary', scriptId),
    saveEvaluation: (evaluationData) => 
      ipcRenderer.invoke('db:save-evaluation', evaluationData),
    getEvaluation: (scriptId: string) => ipcRenderer.invoke('db:get-evaluation', scriptId),
    searchScripts: (query: string) => ipcRenderer.invoke('db:search-scripts', query),
  },
};

// Expose the API through context bridge for security
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the global window object
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
