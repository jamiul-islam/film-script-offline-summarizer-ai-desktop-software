import { describe, it, expect } from 'vitest';
import {
  Script,
  ScriptWithSummary,
  ScriptSummary,
  Character,
  ProductionNote,
  SummaryOptions,
  AppSettings,
  validateScript,
  validateCharacter,
  validateSummaryOptions,
} from '../index';

describe('Type Integration Tests', () => {
  it('should create a complete script workflow with all types', () => {
    // Create a script
    const script: Script = {
      id: 'script-integration-test',
      title: 'Integration Test Script',
      filePath: '/test/path/script.pdf',
      contentHash: 'integration-hash-123',
      wordCount: 30000,
      fileSize: 2048000,
      fileType: 'pdf',
      uploadedAt: new Date('2024-01-01T10:00:00Z'),
      lastModified: new Date('2024-01-01T09:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
    };

    // Validate the script
    const scriptValidation = validateScript(script);
    expect(scriptValidation.isValid).toBe(true);
    expect(scriptValidation.data).toEqual(script);

    // Create characters
    const protagonist: Character = {
      name: 'Alex Thompson',
      description: 'A determined detective solving a complex case',
      importance: 'protagonist',
      relationships: ['Sarah Mitchell', 'Captain Rodriguez'],
      characterArc: 'From cynical to hopeful',
      ageRange: '35-45',
      traits: ['analytical', 'persistent', 'empathetic'],
    };

    const supportingCharacter: Character = {
      name: 'Sarah Mitchell',
      description: "Forensic scientist and Alex's partner",
      importance: 'main',
      relationships: ['Alex Thompson'],
      characterArc: 'Learns to trust her instincts',
      ageRange: '28-35',
      traits: ['methodical', 'brilliant', 'cautious'],
    };

    // Validate characters
    const protagonistValidation = validateCharacter(protagonist);
    const supportingValidation = validateCharacter(supportingCharacter);

    expect(protagonistValidation.isValid).toBe(true);
    expect(supportingValidation.isValid).toBe(true);

    // Create production notes
    const productionNotes: ProductionNote[] = [
      {
        category: 'budget',
        content:
          'Moderate budget required for urban locations and practical effects',
        priority: 'high',
        budgetImpact: 'moderate',
        requirements: ['Urban filming permits', 'Practical effects team'],
      },
      {
        category: 'cast',
        content: 'Requires experienced actors for complex emotional scenes',
        priority: 'high',
        budgetImpact: 'significant',
        requirements: ['A-list or experienced character actors'],
      },
      {
        category: 'technical',
        content:
          'Night shooting and low-light scenes require specialized equipment',
        priority: 'medium',
        budgetImpact: 'moderate',
        requirements: ['Low-light cameras', 'Professional lighting crew'],
      },
    ];

    // Create summary options
    const summaryOptions: SummaryOptions = {
      length: 'detailed',
      focusAreas: [
        'plot',
        'characters',
        'themes',
        'production',
        'marketability',
      ],
      targetAudience: 'Film industry professionals and investors',
      customInstructions:
        'Focus on commercial viability and production feasibility',
      includeProductionNotes: true,
      analyzeCharacterRelationships: true,
      identifyThemes: true,
      assessMarketability: true,
      temperature: 0.7,
      maxTokens: 4000,
    };

    // Validate summary options
    const optionsValidation = validateSummaryOptions(summaryOptions);
    expect(optionsValidation.isValid).toBe(true);

    // Create a complete summary
    const summary: ScriptSummary = {
      id: 'summary-integration-test',
      scriptId: script.id,
      plotOverview:
        'A gripping detective thriller following Alex Thompson as they uncover a conspiracy that reaches the highest levels of city government. When a series of seemingly unrelated crimes reveals a pattern, Alex must navigate corruption, betrayal, and personal demons to bring justice to light.',
      mainCharacters: [protagonist, supportingCharacter],
      themes: [
        'justice vs. corruption',
        'trust and betrayal',
        'redemption',
        'institutional failure',
      ],
      productionNotes,
      genre: 'Crime Thriller',
      estimatedBudget: 'medium',
      targetAudience: 'Adults 25-54, fans of procedural dramas and thrillers',
      toneAndStyle: 'Dark, gritty, with moments of hope and human connection',
      keyScenes: [
        'Opening crime scene discovery',
        'First major revelation about the conspiracy',
        'Confrontation with corrupt officials',
        'Final resolution and justice served',
      ],
      productionChallenges: [
        'Complex night shooting schedule',
        'Multiple urban locations required',
        'Coordinating large ensemble cast',
      ],
      marketability:
        'Strong potential for both theatrical and streaming release. Appeals to fans of crime procedurals with crossover potential to thriller audiences.',
      modelUsed: 'llama2-13b',
      generationOptions: summaryOptions,
      createdAt: new Date('2024-01-01T11:00:00Z'),
      updatedAt: new Date('2024-01-01T11:00:00Z'),
    };

    // Create script with summary
    const scriptWithSummary: ScriptWithSummary = {
      ...script,
      summary,
      status: 'analyzed',
      evaluation: {
        id: 'eval-integration-test',
        scriptId: script.id,
        rating: 4,
        notes:
          'Strong concept with good character development. Production challenges are manageable with proper planning and budget allocation.',
        tags: ['crime', 'thriller', 'character-driven', 'commercial-potential'],
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
      },
    };

    // Verify the complete workflow
    expect(scriptWithSummary.id).toBe(script.id);
    expect(scriptWithSummary.summary?.plotOverview).toContain(
      'detective thriller'
    );
    expect(scriptWithSummary.summary?.mainCharacters).toHaveLength(2);
    expect(scriptWithSummary.summary?.productionNotes).toHaveLength(3);
    expect(scriptWithSummary.evaluation?.rating).toBe(4);
    expect(scriptWithSummary.status).toBe('analyzed');

    // Verify character relationships
    const alexRelationships = scriptWithSummary.summary?.mainCharacters.find(
      c => c.name === 'Alex Thompson'
    )?.relationships;
    expect(alexRelationships).toContain('Sarah Mitchell');

    // Verify production notes structure
    const budgetNote = scriptWithSummary.summary?.productionNotes.find(
      note => note.category === 'budget'
    );
    expect(budgetNote?.priority).toBe('high');
    expect(budgetNote?.budgetImpact).toBe('moderate');

    // Verify themes are properly categorized
    expect(scriptWithSummary.summary?.themes).toContain(
      'justice vs. corruption'
    );
    expect(scriptWithSummary.summary?.themes).toContain('redemption');
  });

  it('should work with app settings and validation', () => {
    const appSettings: AppSettings = {
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

    // Verify settings structure
    expect(appSettings.llm.selectedModel).toBe('llama2-7b');
    expect(appSettings.ui.theme).toBe('dark');
    expect(appSettings.privacy.dataSharing).toBe('none');
    expect(appSettings.fileProcessing.maxFileSizeMB).toBe(50);

    // Verify that settings can be used to create summary options
    const summaryOptionsFromSettings: SummaryOptions = {
      length: appSettings.llm.defaultSummaryLength,
      focusAreas: appSettings.llm.defaultFocusAreas,
      includeProductionNotes: appSettings.llm.includeProductionNotesByDefault,
      analyzeCharacterRelationships:
        appSettings.llm.analyzeCharacterRelationshipsByDefault,
      identifyThemes: appSettings.llm.identifyThemesByDefault,
      assessMarketability: appSettings.llm.assessMarketabilityByDefault,
      temperature: appSettings.llm.defaultTemperature,
      maxTokens: appSettings.llm.defaultMaxTokens,
    };

    const validation = validateSummaryOptions(summaryOptionsFromSettings);
    expect(validation.isValid).toBe(true);
    expect(validation.data?.length).toBe('standard');
    expect(validation.data?.focusAreas).toContain('plot');
  });

  it('should handle validation errors gracefully', () => {
    // Test invalid script
    const invalidScript = {
      id: '', // Invalid: empty ID
      title: 123, // Invalid: not a string
      wordCount: -100, // Invalid: negative
      fileType: 'invalid', // Invalid: not a valid file type
    };

    const scriptValidation = validateScript(invalidScript);
    expect(scriptValidation.isValid).toBe(false);
    expect(scriptValidation.errors.length).toBeGreaterThan(0);
    expect(scriptValidation.errors.some(e => e.field === 'title')).toBe(true);
    expect(scriptValidation.errors.some(e => e.field === 'wordCount')).toBe(
      true
    );
    expect(scriptValidation.errors.some(e => e.field === 'fileType')).toBe(
      true
    );

    // Test invalid character
    const invalidCharacter = {
      name: '', // Invalid: empty name
      importance: 'invalid', // Invalid: not a valid importance level
      relationships: 'not an array', // Invalid: not an array
    };

    const characterValidation = validateCharacter(invalidCharacter);
    expect(characterValidation.isValid).toBe(false);
    expect(characterValidation.errors.length).toBeGreaterThan(0);
    expect(characterValidation.errors.some(e => e.field === 'name')).toBe(true);
    expect(characterValidation.errors.some(e => e.field === 'importance')).toBe(
      true
    );
    expect(
      characterValidation.errors.some(e => e.field === 'relationships')
    ).toBe(true);

    // Test invalid summary options
    const invalidOptions = {
      length: 'invalid', // Invalid: not a valid length
      focusAreas: ['invalid'], // Invalid: contains invalid focus area
      temperature: 2.0, // Invalid: outside valid range
      maxTokens: -100, // Invalid: negative
    };

    const optionsValidation = validateSummaryOptions(invalidOptions);
    expect(optionsValidation.isValid).toBe(false);
    expect(optionsValidation.errors.length).toBeGreaterThan(0);
    expect(optionsValidation.errors.some(e => e.field === 'length')).toBe(true);
    expect(
      optionsValidation.errors.some(e => e.field.startsWith('focusAreas'))
    ).toBe(true);
    expect(optionsValidation.errors.some(e => e.field === 'temperature')).toBe(
      true
    );
    expect(optionsValidation.errors.some(e => e.field === 'maxTokens')).toBe(
      true
    );
  });
});
