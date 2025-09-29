/**
 * Unit tests for PromptService
 * Requirements: 3.1, 3.3, 7.2
 */

import { describe, it, expect } from 'vitest';
import { PromptService } from '../prompt-service';
import { SummaryOptions } from '../../../types/llm-service';

describe('PromptService', () => {
  const mockScriptContent = `
FADE IN:

EXT. COFFEE SHOP - DAY

SARAH (25), a determined journalist, sits across from MIKE (30), a whistleblower.

SARAH
You're sure about this information?

MIKE
I've been working there for five years. I know what I saw.

SARAH
This could bring down the entire company.

MIKE
That's the point.

FADE OUT.
`;

  const basicSummaryOptions: SummaryOptions = {
    length: 'standard',
    focusAreas: ['plot', 'characters'],
    includeProductionNotes: true,
    analyzeCharacterRelationships: true,
    identifyThemes: true,
    assessMarketability: false,
  };

  describe('buildSummaryPrompt', () => {
    it('should create a comprehensive prompt with all sections', () => {
      const prompt = PromptService.buildSummaryPrompt(
        mockScriptContent,
        basicSummaryOptions
      );

      expect(prompt).toContain('You are an expert script analyst');
      expect(prompt).toContain('SCRIPT CONTENT');
      expect(prompt).toContain('PLOT OVERVIEW');
      expect(prompt).toContain('MAIN CHARACTERS');
      expect(prompt).toContain('THEMES');
      expect(prompt).toContain('PRODUCTION NOTES');
      expect(prompt).toContain(mockScriptContent);
    });

    it('should include focus area instructions', () => {
      const options: SummaryOptions = {
        ...basicSummaryOptions,
        focusAreas: ['plot', 'characters', 'production'],
      };

      const prompt = PromptService.buildSummaryPrompt(
        mockScriptContent,
        options
      );

      expect(prompt).toContain('Focus Areas:');
      expect(prompt).toContain('plot structure');
      expect(prompt).toContain('character development');
      expect(prompt).toContain('production challenges');
    });

    it('should adjust length instructions based on options', () => {
      const briefOptions: SummaryOptions = {
        ...basicSummaryOptions,
        length: 'brief',
      };

      const detailedOptions: SummaryOptions = {
        ...basicSummaryOptions,
        length: 'comprehensive',
      };

      const briefPrompt = PromptService.buildSummaryPrompt(
        mockScriptContent,
        briefOptions
      );
      const detailedPrompt = PromptService.buildSummaryPrompt(
        mockScriptContent,
        detailedOptions
      );

      expect(briefPrompt).toContain('200-400 words');
      expect(detailedPrompt).toContain('1200+ words');
    });

    it('should include custom instructions when provided', () => {
      const options: SummaryOptions = {
        ...basicSummaryOptions,
        customInstructions: 'Focus on environmental themes',
      };

      const prompt = PromptService.buildSummaryPrompt(
        mockScriptContent,
        options
      );

      expect(prompt).toContain(
        'Additional Instructions: Focus on environmental themes'
      );
    });

    it('should conditionally include sections based on options', () => {
      const minimalOptions: SummaryOptions = {
        length: 'brief',
        focusAreas: ['plot'],
        includeProductionNotes: false,
        analyzeCharacterRelationships: false,
        identifyThemes: false,
        assessMarketability: false,
      };

      const prompt = PromptService.buildSummaryPrompt(
        mockScriptContent,
        minimalOptions
      );

      expect(prompt).toContain('PLOT OVERVIEW');
      expect(prompt).not.toContain('MAIN CHARACTERS');
      expect(prompt).not.toContain('THEMES');
      expect(prompt).not.toContain('PRODUCTION NOTES');
      expect(prompt).not.toContain('MARKETABILITY');
    });

    it('should include marketability section when requested', () => {
      const options: SummaryOptions = {
        ...basicSummaryOptions,
        assessMarketability: true,
      };

      const prompt = PromptService.buildSummaryPrompt(
        mockScriptContent,
        options
      );

      expect(prompt).toContain('MARKETABILITY');
      expect(prompt).toContain('Commercial viability assessment');
    });

    it('should handle target audience specification', () => {
      const options: SummaryOptions = {
        ...basicSummaryOptions,
        targetAudience: 'independent filmmakers',
      };

      const prompt = PromptService.buildSummaryPrompt(
        mockScriptContent,
        options
      );

      expect(prompt).toContain('independent filmmakers');
    });
  });

  describe('buildScriptTypePrompt', () => {
    it('should add script type specific instructions', () => {
      const featurePrompt = PromptService.buildScriptTypePrompt(
        mockScriptContent,
        'feature',
        basicSummaryOptions
      );
      const shortPrompt = PromptService.buildScriptTypePrompt(
        mockScriptContent,
        'short',
        basicSummaryOptions
      );

      expect(featurePrompt).toContain('feature-length screenplay');
      expect(featurePrompt).toContain('three-act structure');
      expect(shortPrompt).toContain('short film script');
      expect(shortPrompt).toContain('concise storytelling');
    });

    it('should handle unknown script types gracefully', () => {
      const prompt = PromptService.buildScriptTypePrompt(
        mockScriptContent,
        'unknown_type',
        basicSummaryOptions
      );

      expect(prompt).toContain(
        'Analyze this script according to its specific format'
      );
    });
  });

  describe('buildProductionNotesPrompt', () => {
    it('should create a focused production analysis prompt', () => {
      const prompt =
        PromptService.buildProductionNotesPrompt(mockScriptContent);

      expect(prompt).toContain('film production expert');
      expect(prompt).toContain('BUDGET CONSIDERATIONS');
      expect(prompt).toContain('LOCATION REQUIREMENTS');
      expect(prompt).toContain('CAST REQUIREMENTS');
      expect(prompt).toContain('TECHNICAL REQUIREMENTS');
      expect(prompt).toContain('LEGAL CONSIDERATIONS');
      expect(prompt).toContain('SCHEDULING CHALLENGES');
      expect(prompt).toContain('JSON format');
      expect(prompt).toContain(mockScriptContent);
    });

    it('should specify required JSON structure', () => {
      const prompt =
        PromptService.buildProductionNotesPrompt(mockScriptContent);

      expect(prompt).toContain('"productionNotes"');
      expect(prompt).toContain('"category"');
      expect(prompt).toContain('"priority"');
      expect(prompt).toContain('"budgetImpact"');
      expect(prompt).toContain('"requirements"');
    });
  });

  describe('buildCharacterAnalysisPrompt', () => {
    it('should create a character-focused analysis prompt', () => {
      const prompt =
        PromptService.buildCharacterAnalysisPrompt(mockScriptContent);

      expect(prompt).toContain('character development');
      expect(prompt).toContain('NAME');
      expect(prompt).toContain('DESCRIPTION');
      expect(prompt).toContain('IMPORTANCE');
      expect(prompt).toContain('RELATIONSHIPS');
      expect(prompt).toContain('CHARACTER ARC');
      expect(prompt).toContain('AGE RANGE');
      expect(prompt).toContain('TRAITS');
      expect(prompt).toContain(mockScriptContent);
    });

    it('should specify character importance levels', () => {
      const prompt =
        PromptService.buildCharacterAnalysisPrompt(mockScriptContent);

      expect(prompt).toContain('protagonist|main|supporting|minor');
    });
  });

  describe('buildThemeAnalysisPrompt', () => {
    it('should create a theme-focused analysis prompt', () => {
      const prompt = PromptService.buildThemeAnalysisPrompt(mockScriptContent);

      expect(prompt).toContain('thematic analysis');
      expect(prompt).toContain('MAJOR THEMES');
      expect(prompt).toContain('MINOR THEMES');
      expect(prompt).toContain('SYMBOLIC ELEMENTS');
      expect(prompt).toContain('SOCIAL COMMENTARY');
      expect(prompt).toContain('GENRE CONVENTIONS');
      expect(prompt).toContain(mockScriptContent);
    });

    it('should request JSON format for themes', () => {
      const prompt = PromptService.buildThemeAnalysisPrompt(mockScriptContent);

      expect(prompt).toContain('"themes"');
      expect(prompt).toContain('JSON array');
    });
  });

  describe('buildTestPrompt', () => {
    it('should create a simple test prompt', () => {
      const prompt = PromptService.buildTestPrompt();

      expect(prompt).toBe(
        "Please respond with 'Hello, I am working correctly.' to test the connection."
      );
    });
  });

  describe('buildValidationPrompt', () => {
    it('should create a validation prompt with JSON structure', () => {
      const prompt = PromptService.buildValidationPrompt(mockScriptContent);

      expect(prompt).toContain('structured output');
      expect(prompt).toContain('"title"');
      expect(prompt).toContain('"genre"');
      expect(prompt).toContain('"mainCharacter"');
      expect(prompt).toContain('"setting"');
      expect(prompt).toContain('"tone"');
      expect(prompt).toContain(mockScriptContent.substring(0, 500));
    });
  });

  describe('focus area handling', () => {
    it('should handle all focus areas correctly', () => {
      const allFocusAreas: SummaryOptions = {
        length: 'detailed',
        focusAreas: [
          'plot',
          'characters',
          'themes',
          'dialogue',
          'structure',
          'genre',
          'production',
          'marketability',
          'technical',
          'legal',
        ],
        includeProductionNotes: true,
        analyzeCharacterRelationships: true,
        identifyThemes: true,
        assessMarketability: true,
      };

      const prompt = PromptService.buildSummaryPrompt(
        mockScriptContent,
        allFocusAreas
      );

      expect(prompt).toContain('plot structure');
      expect(prompt).toContain('character development');
      expect(prompt).toContain('central themes');
      expect(prompt).toContain('dialogue quality');
      expect(prompt).toContain('three-act structure');
      expect(prompt).toContain('genre conventions');
      expect(prompt).toContain('production challenges');
      expect(prompt).toContain('commercial viability');
      expect(prompt).toContain('technical aspects');
      expect(prompt).toContain('legal issues');
    });
  });

  describe('length variations', () => {
    it('should handle all length options', () => {
      const lengths: Array<SummaryOptions['length']> = [
        'brief',
        'standard',
        'detailed',
        'comprehensive',
      ];

      lengths.forEach(length => {
        const options: SummaryOptions = {
          ...basicSummaryOptions,
          length,
        };

        const prompt = PromptService.buildSummaryPrompt(
          mockScriptContent,
          options
        );
        expect(prompt).toContain('words');
        expect(prompt.length).toBeGreaterThan(0);
      });
    });
  });

  describe('script type variations', () => {
    it('should handle all script types', () => {
      const scriptTypes = [
        'feature',
        'short',
        'tv_episode',
        'pilot',
        'web_series',
        'documentary',
        'commercial',
        'music_video',
      ];

      scriptTypes.forEach(type => {
        const prompt = PromptService.buildScriptTypePrompt(
          mockScriptContent,
          type,
          basicSummaryOptions
        );
        expect(prompt.length).toBeGreaterThan(0);
        expect(prompt).toContain(mockScriptContent);
      });
    });
  });
});
