/**
 * Example usage of the type definitions
 * This file demonstrates how to use the various interfaces and types
 * Requirements: 1.1, 2.1, 3.1, 7.1
 */

import {
  Script,
  ScriptSummary,
  Character,
  ProductionNote,
  SummaryOptions,
  LLMModel,
  AppSettings,
  FileProcessor,
  ParsedScript,
  ValidationResult,
  validateScript,
  validateCharacter,
  validateSummaryOptions,
} from './index';

// Example: Creating a new script record
export const createExampleScript = (): Script => {
  return {
    id: `script-${Date.now()}`,
    title: 'The Last Stand',
    filePath: '/Users/director/scripts/the-last-stand.pdf',
    contentHash: 'sha256-abc123def456...',
    wordCount: 28500,
    fileSize: 1536000, // ~1.5MB
    fileType: 'pdf',
    uploadedAt: new Date(),
    lastModified: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(),
  };
};

// Example: Creating character definitions
export const createExampleCharacters = (): Character[] => {
  return [
    {
      name: 'Marcus Steel',
      description: 'A retired special forces operative forced back into action',
      importance: 'protagonist',
      relationships: ['Elena Vasquez', 'General Harrison'],
      characterArc: 'From reluctant hero to committed protector',
      ageRange: '45-55',
      traits: ['tactical', 'haunted', 'loyal', 'experienced'],
    },
    {
      name: 'Elena Vasquez',
      description: "Brilliant cybersecurity expert and Marcus's tech support",
      importance: 'main',
      relationships: ['Marcus Steel'],
      characterArc: 'Learns to trust her field instincts over pure data',
      ageRange: '30-35',
      traits: ['analytical', 'quick-thinking', 'determined'],
    },
    {
      name: 'Viktor Kozlov',
      description: 'Ruthless arms dealer and primary antagonist',
      importance: 'main',
      relationships: ['Marcus Steel'],
      characterArc: 'Escalating desperation as his empire crumbles',
      ageRange: '50-60',
      traits: ['cunning', 'ruthless', 'charismatic', 'paranoid'],
    },
  ];
};

// Example: Creating production notes
export const createExampleProductionNotes = (): ProductionNote[] => {
  return [
    {
      category: 'budget',
      content: 'High-budget action sequences with practical effects and stunts',
      priority: 'critical',
      budgetImpact: 'major',
      requirements: [
        'Experienced stunt coordinators',
        'Practical effects team',
        'Insurance for high-risk sequences',
      ],
    },
    {
      category: 'location',
      content: 'Multiple international locations including Eastern Europe',
      priority: 'high',
      budgetImpact: 'significant',
      requirements: [
        'Location scouting in Prague and Budapest',
        'International filming permits',
        'Local crew coordination',
      ],
    },
    {
      category: 'cast',
      content: 'Requires A-list action star for Marcus Steel role',
      priority: 'critical',
      budgetImpact: 'major',
      requirements: [
        'Established action star with box office draw',
        'Physical fitness and stunt capability',
        'International appeal',
      ],
    },
    {
      category: 'technical',
      content: 'Complex action choreography and vehicle sequences',
      priority: 'high',
      budgetImpact: 'significant',
      requirements: [
        'Second unit director for action',
        'Specialized camera equipment',
        'Vehicle coordination team',
      ],
    },
  ];
};

// Example: Creating summary options for different use cases
export const createBriefSummaryOptions = (): SummaryOptions => {
  return {
    length: 'brief',
    focusAreas: ['plot', 'genre'],
    includeProductionNotes: false,
    analyzeCharacterRelationships: false,
    identifyThemes: true,
    assessMarketability: true,
    temperature: 0.5,
    maxTokens: 1000,
  };
};

export const createDetailedSummaryOptions = (): SummaryOptions => {
  return {
    length: 'comprehensive',
    focusAreas: [
      'plot',
      'characters',
      'themes',
      'production',
      'marketability',
      'technical',
    ],
    targetAudience: 'Film industry professionals and investors',
    customInstructions:
      'Focus on commercial viability, production feasibility, and market positioning',
    includeProductionNotes: true,
    analyzeCharacterRelationships: true,
    identifyThemes: true,
    assessMarketability: true,
    temperature: 0.7,
    maxTokens: 4000,
  };
};

// Example: Creating a complete script summary
export const createExampleSummary = (scriptId: string): ScriptSummary => {
  return {
    id: `summary-${Date.now()}`,
    scriptId,
    plotOverview:
      'When a cyber attack threatens global security, retired special forces operative Marcus Steel must team up with cybersecurity expert Elena Vasquez to stop arms dealer Viktor Kozlov from selling advanced weapons to terrorist organizations. Racing against time across international locations, they must overcome personal demons and trust each other to prevent a catastrophic attack.',
    mainCharacters: createExampleCharacters(),
    themes: [
      'redemption and second chances',
      'trust vs. betrayal',
      'technology vs. human instinct',
      'sacrifice for the greater good',
    ],
    productionNotes: createExampleProductionNotes(),
    genre: 'Action Thriller',
    estimatedBudget: 'high',
    targetAudience:
      'Adults 18-54, action movie enthusiasts, international markets',
    toneAndStyle:
      'Fast-paced, gritty realism with moments of humor and humanity',
    keyScenes: [
      'Opening cyber attack sequence',
      "Marcus and Elena's first meeting",
      'Prague chase sequence',
      'Final confrontation with Kozlov',
    ],
    productionChallenges: [
      'Coordinating international filming locations',
      'Complex action choreography',
      'Balancing practical and digital effects',
    ],
    marketability:
      'Strong international appeal with proven action thriller formula. Potential for franchise development with compelling characters and world-building.',
    modelUsed: 'llama2-13b',
    generationOptions: createDetailedSummaryOptions(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// Example: Creating default app settings
export const createDefaultAppSettings = (): AppSettings => {
  return {
    llm: {
      selectedModel: 'llama2-7b',
      defaultSummaryLength: 'standard',
      defaultFocusAreas: ['plot', 'characters', 'themes'],
      defaultTemperature: 0.7,
      defaultMaxTokens: 2000,
      includeProductionNotesByDefault: true,
      analyzeCharacterRelationshipsByDefault: true,
      identifyThemesByDefault: true,
      assessMarketabilityByDefault: false,
      operationTimeout: 300000, // 5 minutes
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
      processingTimeout: 60000, // 1 minute
      createFileBackups: false,
      backupRetentionDays: 30,
    },
    data: {
      autoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      autoBackup: true,
      backupFrequencyHours: 24,
      maxBackupsToKeep: 7,
      compressBackups: true,
      dataRetentionDays: 0, // Keep forever
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
};

// Example: Validation workflow
export const validateScriptWorkflow = (
  scriptData: unknown
): ValidationResult<Script> => {
  const validation = validateScript(scriptData);

  if (!validation.isValid) {
    console.error('Script validation failed:', validation.errors);
    return validation;
  }

  if (validation.warnings.length > 0) {
    console.warn('Script validation warnings:', validation.warnings);
  }

  return validation;
};

// Example: Mock file processor implementation structure
export const createMockFileProcessor = (): Partial<FileProcessor> => {
  return {
    getSupportedExtensions: () => ['.pdf', '.docx', '.txt'],
    isSupported: (fileType: string) =>
      ['pdf', 'docx', 'txt'].includes(fileType),
    validateFile: async (filePath: string): Promise<ValidationResult> => {
      // Mock validation logic
      return {
        isValid: true,
        errors: [],
        warnings: [],
        detectedFileType: 'pdf',
        fileSize: 1024000,
        isReadable: true,
      };
    },
    parseFile: async (filePath: string, fileType): Promise<ParsedScript> => {
      // Mock parsing logic
      return {
        content: 'FADE IN: EXT. LOCATION - DAY\n\nMock script content...',
        title: 'Mock Script Title',
        metadata: {
          title: 'Mock Script Title',
          wordCount: 25000,
          characterCount: 125000,
          fileSize: 1024000,
        },
        confidence: 0.95,
      };
    },
  };
};

// Example: Mock LLM model definition
export const createMockLLMModel = (): LLMModel => {
  return {
    id: 'llama2-7b',
    name: 'Llama 2 7B',
    description:
      "Meta's Llama 2 model optimized for text analysis and creative tasks",
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
};
