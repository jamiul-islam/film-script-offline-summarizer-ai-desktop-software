/**
 * Unit tests for IPC handlers
 * Requirements: 1.1, 2.1, 3.2, 6.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';

// Mock electron modules
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeAllListeners: vi.fn(),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
}));

// Mock file system
vi.mock('node:fs/promises');

// Mock services
vi.mock('../../services/file-processing', () => ({
  fileProcessorFactory: {
    createProcessor: vi.fn(),
  },
}));

vi.mock('../../services/llm', () => ({
  OllamaService: vi.fn(),
}));

vi.mock('../../database', () => ({
  getDatabaseManager: vi.fn(),
}));

import {
  registerFileHandlers,
  registerLLMHandlers,
  registerDatabaseHandlers,
  initializeIPCHandlers,
  cleanupIPCHandlers,
} from '../ipc-handlers';
import { fileProcessorFactory } from '../../services/file-processing';
import { OllamaService } from '../../services/llm';
import { getDatabaseManager } from '../../database';

describe('IPC Handlers', () => {
  const mockIpcMain = ipcMain as any;
  const mockFileProcessorFactory = fileProcessorFactory as any;
  const mockOllamaService = OllamaService as any;
  const mockGetDatabaseManager = getDatabaseManager as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('File Handlers', () => {
    beforeEach(() => {
      registerFileHandlers();
    });

    it('should register file dialog handler', () => {
      expect(mockIpcMain.handle).toHaveBeenCalledWith(
        'file:open-dialog',
        expect.any(Function)
      );
    });

    it('should register file validation handler', () => {
      expect(mockIpcMain.handle).toHaveBeenCalledWith(
        'file:validate',
        expect.any(Function)
      );
    });

    it('should register file processing handler', () => {
      expect(mockIpcMain.handle).toHaveBeenCalledWith(
        'file:process',
        expect.any(Function)
      );
    });

    describe('File Validation', () => {
      let validateHandler: Function;

      beforeEach(() => {
        const calls = mockIpcMain.handle.mock.calls;
        const validateCall = calls.find(call => call[0] === 'file:validate');
        validateHandler = validateCall[1];
      });

      it('should reject unsupported file extensions', async () => {
        const result = await validateHandler(null, '/path/to/file.exe');

        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe('UNSUPPORTED_FORMAT');
      });

      it('should reject files with path traversal attempts', async () => {
        const result = await validateHandler(null, '../../../etc/passwd');

        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe('UNSUPPORTED_FORMAT');
      });

      it('should accept valid PDF files', async () => {
        const mockProcessor = {
          validateFile: vi.fn().mockResolvedValue({
            isValid: true,
            errors: [],
            warnings: [],
            fileSize: 1024,
            isReadable: true,
          }),
        };

        mockFileProcessorFactory.createProcessor.mockReturnValue(mockProcessor);
        vi.mocked(fs.stat).mockResolvedValue({ size: 1024 } as any);

        const result = await validateHandler(null, '/path/to/script.pdf');

        expect(mockProcessor.validateFile).toHaveBeenCalledWith(
          '/path/to/script.pdf'
        );
        expect(result.isValid).toBe(true);
      });

      it('should reject files that are too large', async () => {
        vi.mocked(fs.stat).mockResolvedValue({
          size: 100 * 1024 * 1024,
        } as any); // 100MB

        const result = await validateHandler(null, '/path/to/large-script.pdf');

        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe('FILE_TOO_LARGE');
      });
    });

    describe('File Processing', () => {
      let processHandler: Function;

      beforeEach(() => {
        const calls = mockIpcMain.handle.mock.calls;
        const processCall = calls.find(call => call[0] === 'file:process');
        processHandler = processCall[1];
      });

      it('should process valid files', async () => {
        const mockProcessor = {
          parseFile: vi.fn().mockResolvedValue({
            content: 'Script content',
            title: 'Test Script',
            metadata: { wordCount: 100 },
            warnings: [],
          }),
        };

        mockFileProcessorFactory.createProcessor.mockReturnValue(mockProcessor);
        vi.mocked(fs.stat).mockResolvedValue({ size: 1024 } as any);

        const result = await processHandler(null, '/path/to/script.pdf');

        expect(mockProcessor.parseFile).toHaveBeenCalledWith(
          '/path/to/script.pdf',
          'pdf'
        );
        expect(result.content).toBe('Script content');
      });

      it('should reject invalid file paths', async () => {
        await expect(
          processHandler(null, '../../../etc/passwd')
        ).rejects.toThrow('Invalid file path');
      });
    });
  });

  describe('LLM Handlers', () => {
    let mockLLMInstance: any;

    beforeEach(() => {
      mockLLMInstance = {
        isAvailable: vi.fn(),
        getServiceStatus: vi.fn(),
        listAvailableModels: vi.fn(),
        getCurrentModel: vi.fn(),
        setActiveModel: vi.fn(),
        testModel: vi.fn(),
        generateSummary: vi.fn(),
        cancelGeneration: vi.fn(),
      };

      mockOllamaService.mockImplementation(() => mockLLMInstance);
      registerLLMHandlers();
    });

    it('should register all LLM handlers', () => {
      const expectedHandlers = [
        'llm:is-available',
        'llm:get-status',
        'llm:list-models',
        'llm:get-current-model',
        'llm:set-model',
        'llm:test-model',
        'llm:generate-summary',
        'llm:cancel-generation',
      ];

      expectedHandlers.forEach(handler => {
        expect(mockIpcMain.handle).toHaveBeenCalledWith(
          handler,
          expect.any(Function)
        );
      });
    });

    it('should handle LLM availability check', async () => {
      mockLLMInstance.isAvailable.mockResolvedValue(true);

      const calls = mockIpcMain.handle.mock.calls;
      const availabilityCall = calls.find(
        call => call[0] === 'llm:is-available'
      );
      const handler = availabilityCall[1];

      const result = await handler();
      expect(result).toBe(true);
      expect(mockLLMInstance.isAvailable).toHaveBeenCalled();
    });

    it('should handle summary generation', async () => {
      const mockSummary = {
        plotOverview: 'Test plot',
        mainCharacters: [],
        themes: [],
        productionNotes: [],
      };

      mockLLMInstance.generateSummary.mockResolvedValue(mockSummary);

      const calls = mockIpcMain.handle.mock.calls;
      const summaryCall = calls.find(
        call => call[0] === 'llm:generate-summary'
      );
      const handler = summaryCall[1];

      const options = { length: 'standard', focusAreas: ['plot'] };
      const result = await handler(null, 'Script content', options);

      expect(result).toEqual(mockSummary);
      expect(mockLLMInstance.generateSummary).toHaveBeenCalledWith(
        'Script content',
        options
      );
    });
  });

  describe('Database Handlers', () => {
    let mockDB: unknown;

    beforeEach(() => {
      mockDB = {
        saveScript: vi.fn(),
        getScript: vi.fn(),
        getAllScripts: vi.fn(),
        updateScript: vi.fn(),
        deleteScript: vi.fn(),
        saveSummary: vi.fn(),
        getSummaryByScriptId: vi.fn(),
        saveEvaluation: vi.fn(),
        getEvaluationByScriptId: vi.fn(),
        searchScripts: vi.fn(),
      };

      mockGetDatabaseManager.mockReturnValue(mockDB);
      registerDatabaseHandlers();
    });

    it('should register all database handlers', () => {
      const expectedHandlers = [
        'db:save-script',
        'db:get-script',
        'db:get-all-scripts',
        'db:update-script',
        'db:delete-script',
        'db:save-summary',
        'db:get-summary',
        'db:save-evaluation',
        'db:get-evaluation',
        'db:search-scripts',
      ];

      expectedHandlers.forEach(handler => {
        expect(mockIpcMain.handle).toHaveBeenCalledWith(
          handler,
          expect.any(Function)
        );
      });
    });

    it('should handle script saving', async () => {
      const mockScript = {
        id: 1,
        title: 'Test Script',
        file_path: '/path/to/script.pdf',
        content_hash: 'hash123',
        word_count: 100,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      mockDB.saveScript.mockResolvedValue(mockScript);

      const calls = mockIpcMain.handle.mock.calls;
      const saveCall = calls.find(call => call[0] === 'db:save-script');
      const handler = saveCall[1];

      const scriptData = {
        title: 'Test Script',
        file_path: '/path/to/script.pdf',
        content_hash: 'hash123',
        word_count: 100,
      };

      const result = await handler(null, scriptData);

      expect(result).toEqual(mockScript);
      expect(mockDB.saveScript).toHaveBeenCalledWith(scriptData);
    });

    it('should handle script retrieval', async () => {
      const mockScript = {
        id: 1,
        title: 'Test Script',
        file_path: '/path/to/script.pdf',
        content_hash: 'hash123',
        word_count: 100,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      mockDB.getScript.mockResolvedValue(mockScript);

      const calls = mockIpcMain.handle.mock.calls;
      const getCall = calls.find(call => call[0] === 'db:get-script');
      const handler = getCall[1];

      const result = await handler(null, '1');

      expect(result).toEqual(mockScript);
      expect(mockDB.getScript).toHaveBeenCalledWith('1');
    });
  });

  describe('Initialization and Cleanup', () => {
    it('should initialize all handlers', () => {
      const initialCallCount = mockIpcMain.handle.mock.calls.length;
      initializeIPCHandlers();

      // Should register 21 handlers total (3 file + 8 LLM + 10 database)
      expect(mockIpcMain.handle).toHaveBeenCalledTimes(initialCallCount + 21);
    });

    it('should cleanup all handlers', () => {
      cleanupIPCHandlers();

      const expectedHandlers = [
        'file:open-dialog',
        'file:validate',
        'file:process',
        'llm:is-available',
        'llm:get-status',
        'llm:list-models',
        'llm:get-current-model',
        'llm:set-model',
        'llm:test-model',
        'llm:generate-summary',
        'llm:cancel-generation',
        'db:save-script',
        'db:get-script',
        'db:get-all-scripts',
        'db:update-script',
        'db:delete-script',
        'db:save-summary',
        'db:get-summary',
        'db:save-evaluation',
        'db:get-evaluation',
        'db:search-scripts',
      ];

      expectedHandlers.forEach(handler => {
        expect(mockIpcMain.removeAllListeners).toHaveBeenCalledWith(handler);
      });
    });
  });
});
