import { describe, it, expect } from 'vitest';
import type {
  Script,
  ScriptMetadata,
  ScriptEvaluation,
  FileType,
  ScriptStatus,
  ScriptWithSummary,
} from '../script';
import type {
  ScriptSummary,
  Character,
  ProductionNote,
  CharacterImportance,
  ProductionCategory,
  Priority,
  BudgetCategory,
  BudgetImpact,
} from '../summary';
import type {
  FileProcessor,
  ParsedScript,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  FileProcessingOptions,
  ProcessingProgress,
  ProcessingStep,
} from '../file-processing';
import type {
  LLMService,
  SummaryOptions,
  LLMModel,
  ModelTestResult,
  ServiceStatus,
  ModelPerformance,
  ModelRequirements,
  MemoryUsage,
  SummaryLength,
  FocusArea,
  ModelCapability,
  GenerationProgress,
  GenerationStage,
} from '../llm-service';
import type {
  AppSettings,
  LLMSettings,
  UISettings,
  FileProcessingSettings,
  DataSettings,
  PerformanceSettings,
  PrivacySettings,
  WindowPreferences,
  Theme,
  LibraryView,
  SortOption,
  SortDirection,
  ExportFormat,
  DataSharingLevel,
  SettingsValidation,
  SettingsError,
  SettingsWarning,
} from '../settings';

describe('Type Definitions', () => {
  describe('Script Types', () => {
    it('should allow valid Script objects', () => {
      const script: Script = {
        id: 'script-123',
        title: 'Test Script',
        filePath: '/path/to/script.pdf',
        contentHash: 'abc123',
        wordCount: 25000,
        fileSize: 1024000,
        fileType: 'pdf',
        uploadedAt: new Date(),
        lastModified: new Date(),
        updatedAt: new Date(),
      };

      expect(script.id).toBe('script-123');
      expect(script.fileType).toBe('pdf');
      expect(typeof script.wordCount).toBe('number');
    });

    it('should allow valid ScriptMetadata objects', () => {
      const metadata: ScriptMetadata = {
        title: 'Test Script',
        author: 'John Doe',
        wordCount: 25000,
        characterCount: 125000,
        fileSize: 1024000,
        pageCount: 120,
        createdAt: new Date(),
        modifiedAt: new Date(),
        additionalMetadata: {
          format: 'Final Draft',
          version: '1.2',
        },
      };

      expect(metadata.title).toBe('Test Script');
      expect(metadata.author).toBe('John Doe');
      expect(metadata.additionalMetadata?.format).toBe('Final Draft');
    });

    it('should allow valid ScriptEvaluation objects', () => {
      const evaluation: ScriptEvaluation = {
        id: 'eval-123',
        scriptId: 'script-123',
        rating: 4,
        notes: 'Great potential, needs minor revisions',
        tags: ['drama', 'indie', 'character-driven'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(evaluation.rating).toBe(4);
      expect(evaluation.tags).toContain('drama');
    });

    it('should enforce FileType union', () => {
      const validTypes: FileType[] = ['pdf', 'docx', 'txt'];
      expect(validTypes).toHaveLength(3);
      
      // TypeScript should prevent invalid types at compile time
      // const invalidType: FileType = 'doc'; // This would cause a TypeScript error
    });

    it('should enforce ScriptStatus union', () => {
      const validStatuses: ScriptStatus[] = ['uploaded', 'processing', 'analyzed', 'error'];
      expect(validStatuses).toHaveLength(4);
    });
  });

  describe('Summary Types', () => {
    it('should allow valid ScriptSummary objects', () => {
      const summary: ScriptSummary = {
        id: 'summary-123',
        scriptId: 'script-123',
        plotOverview: 'A compelling story about...',
        mainCharacters: [],
        themes: ['redemption', 'family'],
        productionNotes: [],
        genre: 'Drama',
        estimatedBudget: 'medium',
        targetAudience: 'Adults 25-54',
        modelUsed: 'llama2-7b',
        generationOptions: {
          length: 'standard',
          focusAreas: ['plot', 'characters'],
          includeProductionNotes: true,
          analyzeCharacterRelationships: true,
          identifyThemes: true,
          assessMarketability: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(summary.genre).toBe('Drama');
      expect(summary.themes).toContain('redemption');
      expect(summary.estimatedBudget).toBe('medium');
    });

    it('should allow valid Character objects', () => {
      const character: Character = {
        name: 'Sarah Connor',
        description: 'Strong-willed protagonist fighting for survival',
        importance: 'protagonist',
        relationships: ['John Connor', 'Kyle Reese'],
        characterArc: 'From victim to warrior',
        ageRange: '25-35',
        traits: ['determined', 'protective', 'resourceful'],
      };

      expect(character.importance).toBe('protagonist');
      expect(character.relationships).toContain('John Connor');
    });

    it('should allow valid ProductionNote objects', () => {
      const note: ProductionNote = {
        category: 'budget',
        content: 'Requires significant VFX budget for action sequences',
        priority: 'high',
        budgetImpact: 'significant',
        requirements: ['VFX team', 'Extended post-production'],
      };

      expect(note.category).toBe('budget');
      expect(note.priority).toBe('high');
      expect(note.budgetImpact).toBe('significant');
    });

    it('should enforce enum types', () => {
      const importance: CharacterImportance = 'protagonist';
      const category: ProductionCategory = 'technical';
      const priority: Priority = 'critical';
      const budget: BudgetCategory = 'blockbuster';
      const impact: BudgetImpact = 'major';

      expect(importance).toBe('protagonist');
      expect(category).toBe('technical');
      expect(priority).toBe('critical');
      expect(budget).toBe('blockbuster');
      expect(impact).toBe('major');
    });
  });

  describe('File Processing Types', () => {
    it('should define FileProcessor interface correctly', () => {
      // This test verifies the interface structure exists
      // In a real implementation, we would test actual implementations
      const mockProcessor: Partial<FileProcessor> = {
        getSupportedExtensions: () => ['.pdf', '.docx', '.txt'],
        isSupported: (fileType: string) => ['pdf', 'docx', 'txt'].includes(fileType),
      };

      expect(mockProcessor.getSupportedExtensions?.()).toContain('.pdf');
      expect(mockProcessor.isSupported?.('pdf')).toBe(true);
      expect(mockProcessor.isSupported?.('doc')).toBe(false);
    });

    it('should allow valid ParsedScript objects', () => {
      const parsed: ParsedScript = {
        content: 'FADE IN: EXT. HOUSE - DAY...',
        title: 'My Script',
        metadata: {
          title: 'My Script',
          wordCount: 25000,
          characterCount: 125000,
          fileSize: 1024000,
        },
        warnings: ['Large file size may affect performance'],
        confidence: 0.95,
      };

      expect(parsed.title).toBe('My Script');
      expect(parsed.confidence).toBe(0.95);
      expect(parsed.warnings).toContain('Large file size may affect performance');
    });

    it('should allow valid ValidationResult objects', () => {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [
          {
            code: 'LARGE_FILE_SIZE',
            message: 'File is larger than recommended',
            details: 'File size: 50MB',
          },
        ],
        detectedFileType: 'pdf',
        fileSize: 52428800,
        isReadable: true,
      };

      expect(result.isValid).toBe(true);
      expect(result.detectedFileType).toBe('pdf');
      expect(result.warnings).toHaveLength(1);
    });

    it('should define processing enums correctly', () => {
      const step: ProcessingStep = 'parsing';
      const steps: ProcessingStep[] = [
        'validating',
        'reading',
        'parsing',
        'extracting_metadata',
        'validating_content',
        'complete',
        'error',
      ];

      expect(steps).toContain(step);
      expect(steps).toHaveLength(7);
    });
  });

  describe('LLM Service Types', () => {
    it('should allow valid SummaryOptions objects', () => {
      const options: SummaryOptions = {
        length: 'detailed',
        focusAreas: ['plot', 'characters', 'themes', 'production'],
        targetAudience: 'Film industry professionals',
        customInstructions: 'Focus on commercial viability',
        includeProductionNotes: true,
        analyzeCharacterRelationships: true,
        identifyThemes: true,
        assessMarketability: true,
        temperature: 0.7,
        maxTokens: 4000,
      };

      expect(options.length).toBe('detailed');
      expect(options.focusAreas).toContain('production');
      expect(options.temperature).toBe(0.7);
    });

    it('should allow valid LLMModel objects', () => {
      const model: LLMModel = {
        id: 'llama2-7b',
        name: 'Llama 2 7B',
        description: 'Meta\'s Llama 2 model with 7 billion parameters',
        version: '2.0',
        parameterCount: '7B',
        isAvailable: true,
        isDownloaded: true,
        capabilities: ['text_analysis', 'creative_writing', 'structured_output'],
        performance: {
          averageResponseTime: 2500,
          qualityRating: 4,
          memoryEfficiency: 3,
          speedRating: 4,
        },
        requirements: {
          minMemoryGB: 8,
          recommendedMemoryGB: 16,
          diskSpaceGB: 4,
          supportsGPU: true,
          minCPUCores: 4,
        },
      };

      expect(model.name).toBe('Llama 2 7B');
      expect(model.capabilities).toContain('text_analysis');
      expect(model.performance.qualityRating).toBe(4);
      expect(model.requirements.minMemoryGB).toBe(8);
    });

    it('should define enum types correctly', () => {
      const length: SummaryLength = 'comprehensive';
      const area: FocusArea = 'marketability';
      const capability: ModelCapability = 'long_context';
      const stage: GenerationStage = 'analyzing_themes';

      expect(length).toBe('comprehensive');
      expect(area).toBe('marketability');
      expect(capability).toBe('long_context');
      expect(stage).toBe('analyzing_themes');
    });
  });

  describe('Settings Types', () => {
    it('should allow valid AppSettings objects', () => {
      const settings: AppSettings = {
        llm: {
          selectedModel: 'llama2-7b',
          defaultSummaryLength: 'standard',
          defaultFocusAreas: ['plot', 'characters'],
          defaultTemperature: 0.7,
          defaultMaxTokens: 2000,
          includeProductionNotesByDefault: true,
          analyzeCharacterRelationshipsByDefault: true,
          identifyThemesByDefault: true,
          assessMarketabilityByDefault: false,
          operationTimeout: 300000,
          autoRetryFailedOperations: true,
          maxRetryAttempts: 3,
        },
        ui: {
          theme: 'dark',
          enableAnimations: true,
          animationSpeed: 1.0,
          defaultLibraryView: 'grid',
          scriptsPerPage: 20,
          defaultSortBy: 'dateAdded',
          defaultSortDirection: 'desc',
          showFileSizeInLibrary: true,
          showWordCountInLibrary: true,
          autoExpandSummarySections: false,
          defaultExportFormat: 'pdf',
          windowPreferences: {
            width: 1200,
            height: 800,
            isMaximized: false,
            isFullscreen: false,
            sidebarWidth: 300,
            sidebarCollapsed: false,
          },
        },
        fileProcessing: {
          maxFileSizeMB: 50,
          validateFileContent: true,
          autoExtractMetadata: true,
          defaultEncoding: 'utf-8',
          processingTimeout: 60000,
          createFileBackups: false,
          backupRetentionDays: 30,
        },
        data: {
          autoSave: true,
          autoSaveInterval: 30000,
          autoBackup: true,
          backupFrequencyHours: 24,
          maxBackupsToKeep: 7,
          compressBackups: true,
          dataRetentionDays: 0,
          exportOnClose: false,
        },
        performance: {
          maxConcurrentProcessing: 2,
          memoryLimitMB: 2048,
          enablePerformanceMonitoring: true,
          optimizeForBattery: false,
          useHardwareAcceleration: true,
          cacheSizeLimitMB: 512,
          preloadFrequentData: true,
        },
        privacy: {
          collectUsageStatistics: false,
          autoCheckUpdates: true,
          sendCrashReports: false,
          dataSharing: 'none',
          clearTempFilesOnExit: true,
          encryptLocalData: true,
        },
        lastUpdated: new Date(),
        version: '1.0.0',
      };

      expect(settings.ui.theme).toBe('dark');
      expect(settings.llm.selectedModel).toBe('llama2-7b');
      expect(settings.privacy.dataSharing).toBe('none');
    });

    it('should define settings enum types correctly', () => {
      const theme: Theme = 'system';
      const view: LibraryView = 'compact';
      const sort: SortOption = 'rating';
      const direction: SortDirection = 'asc';
      const format: ExportFormat = 'json';
      const sharing: DataSharingLevel = 'minimal';

      expect(theme).toBe('system');
      expect(view).toBe('compact');
      expect(sort).toBe('rating');
      expect(direction).toBe('asc');
      expect(format).toBe('json');
      expect(sharing).toBe('minimal');
    });
  });

  describe('Type Relationships', () => {
    it('should allow ScriptWithSummary to extend Script', () => {
      const scriptWithSummary: ScriptWithSummary = {
        id: 'script-123',
        title: 'Test Script',
        filePath: '/path/to/script.pdf',
        contentHash: 'abc123',
        wordCount: 25000,
        fileSize: 1024000,
        fileType: 'pdf',
        uploadedAt: new Date(),
        lastModified: new Date(),
        updatedAt: new Date(),
        status: 'analyzed',
        summary: {
          id: 'summary-123',
          scriptId: 'script-123',
          plotOverview: 'A story about...',
          mainCharacters: [],
          themes: [],
          productionNotes: [],
          genre: 'Drama',
          modelUsed: 'llama2-7b',
          generationOptions: {
            length: 'standard',
            focusAreas: ['plot'],
            includeProductionNotes: true,
            analyzeCharacterRelationships: true,
            identifyThemes: true,
            assessMarketability: false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        evaluation: {
          id: 'eval-123',
          scriptId: 'script-123',
          rating: 4,
          notes: 'Good script',
          tags: ['drama'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      expect(scriptWithSummary.status).toBe('analyzed');
      expect(scriptWithSummary.summary?.genre).toBe('Drama');
      expect(scriptWithSummary.evaluation?.rating).toBe(4);
    });
  });
});