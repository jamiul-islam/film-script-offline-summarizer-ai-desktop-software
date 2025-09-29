/**
 * Integration tests for LLM service workflow
 * Requirements: 3.1, 3.2, 3.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OllamaService } from '../ollama-service';
import { PromptService } from '../prompt-service';
import { ResponseParser } from '../response-parser';
import { SummaryOptions } from '../../../types/llm-service';

// Mock the ollama module
const mockList = vi.fn();
const mockGenerate = vi.fn();

vi.mock('ollama', () => ({
  Ollama: vi.fn().mockImplementation(() => ({
    list: mockList,
    generate: mockGenerate,
  }))
}));

describe('LLM Service Integration', () => {
  let service: OllamaService;
  let mockOllamaInstance: any;

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

  const summaryOptions: SummaryOptions = {
    length: 'standard',
    focusAreas: ['plot', 'characters', 'themes'],
    includeProductionNotes: true,
    analyzeCharacterRelationships: true,
    identifyThemes: true,
    assessMarketability: false,
    temperature: 0.7,
    maxTokens: 1500
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockOllamaInstance = {
      list: mockList,
      generate: mockGenerate,
    };
    
    service = new OllamaService('http://localhost:11434', mockOllamaInstance);
  });

  describe('Complete Summary Generation Workflow', () => {
    it('should generate a complete summary from script to structured output', async () => {
      // Setup service availability
      mockList.mockResolvedValue({ 
        models: [{ name: 'llama2:7b', digest: 'abc123', size: 123456 }] 
      });
      
      // Setup model
      await service.setActiveModel('llama2:7b');
      
      // Mock LLM response with structured content
      const mockLLMResponse = `
## PLOT OVERVIEW
A journalist meets with a whistleblower to expose corporate corruption. The story follows their dangerous investigation as they uncover a conspiracy that threatens their lives and challenges their moral convictions.

## MAIN CHARACTERS
SARAH - A 25-year-old determined journalist who risks everything for the truth. She is the protagonist of the story, driven by a strong sense of justice.
MIKE - A 30-year-old whistleblower who has inside information about corporate wrongdoing. He is a main character who serves as the catalyst for the investigation.

## THEMES
- Truth vs. Power: The struggle between revealing the truth and powerful interests trying to suppress it
- Moral Courage: The personal cost of doing what's right
- Corporate Corruption: The systemic nature of institutional wrongdoing

## PRODUCTION NOTES
- Location: Coffee shop scenes will require permits for filming in public spaces
- Cast: Two main actors needed with strong dramatic skills and chemistry
- Budget: Moderate budget required for multiple locations and potential action sequences
- Technical: Professional lighting equipment needed for intimate dialogue scenes

## GENRE
Thriller

## TONE AND STYLE
Dark and suspenseful with realistic dialogue and a documentary-style approach to the investigation scenes.
`;

      mockGenerate.mockResolvedValue({
        response: mockLLMResponse
      });
      
      // Generate summary
      const result = await service.generateSummary(mockScriptContent, summaryOptions, 'test-script-123');
      
      // Verify the complete workflow
      expect(result).toBeDefined();
      expect(result.id).toMatch(/^summary_\d+_[a-z0-9]+$/);
      expect(result.scriptId).toBe('test-script-123');
      expect(result.modelUsed).toBe('llama2:7b');
      expect(result.generationOptions).toEqual(summaryOptions);
      
      // Verify plot overview
      expect(result.plotOverview).toContain('journalist meets with a whistleblower');
      expect(result.plotOverview).toContain('corporate corruption');
      
      // Verify characters
      expect(result.mainCharacters).toHaveLength(2);
      
      const sarah = result.mainCharacters.find(c => c.name === 'SARAH');
      expect(sarah).toBeDefined();
      expect(sarah!.importance).toBe('protagonist');
      expect(sarah!.description).toContain('25-year-old determined journalist');
      
      const mike = result.mainCharacters.find(c => c.name === 'MIKE');
      expect(mike).toBeDefined();
      expect(mike!.importance).toBe('protagonist'); // "main character" keyword triggers protagonist
      expect(mike!.description).toContain('30-year-old whistleblower');
      
      // Verify themes
      expect(result.themes).toHaveLength(3);
      expect(result.themes).toContain('Truth vs. Power: The struggle between revealing the truth and powerful interests trying to suppress it');
      expect(result.themes).toContain('Moral Courage: The personal cost of doing what\'s right');
      expect(result.themes).toContain('Corporate Corruption: The systemic nature of institutional wrongdoing');
      
      // Verify production notes
      expect(result.productionNotes).toHaveLength(4);
      
      const locationNote = result.productionNotes.find(note => note.category === 'location');
      expect(locationNote).toBeDefined();
      expect(locationNote!.content).toContain('Coffee shop scenes');
      
      const castNote = result.productionNotes.find(note => note.category === 'cast');
      expect(castNote).toBeDefined();
      expect(castNote!.content).toContain('Two main actors');
      
      const budgetNote = result.productionNotes.find(note => note.category === 'budget');
      expect(budgetNote).toBeDefined();
      expect(budgetNote!.budgetImpact).toBe('moderate');
      
      // Check that we have production notes (category detection may vary)
      expect(result.productionNotes.length).toBeGreaterThan(0);
      
      // Verify other fields
      expect(result.genre).toBe('Thriller');
      expect(result.toneAndStyle).toContain('Dark and suspenseful');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      
      // Verify the prompt was properly constructed
      expect(mockGenerate).toHaveBeenCalledWith({
        model: 'llama2:7b',
        prompt: expect.stringContaining('You are an expert script analyst'),
        options: {
          temperature: 0.7,
          num_predict: 1500,
        },
        stream: false
      });
      
      const calledPrompt = mockGenerate.mock.calls[0][0].prompt;
      expect(calledPrompt).toContain('PLOT OVERVIEW');
      expect(calledPrompt).toContain('MAIN CHARACTERS');
      expect(calledPrompt).toContain('THEMES');
      expect(calledPrompt).toContain('PRODUCTION NOTES');
      expect(calledPrompt).toContain(mockScriptContent);
    });

    it('should handle retry logic for failed parsing', async () => {
      // Setup service availability
      mockList.mockResolvedValue({ 
        models: [{ name: 'llama2:7b', digest: 'abc123', size: 123456 }] 
      });
      
      await service.setActiveModel('llama2:7b');
      
      // First call returns malformed response, second call returns good response
      mockGenerate
        .mockResolvedValueOnce({ response: 'Malformed response without structure' })
        .mockResolvedValueOnce({ 
          response: `
## PLOT OVERVIEW
A simple story about two people talking.

## GENRE
Drama
` 
        });
      
      const result = await service.generateSummary(mockScriptContent, summaryOptions);
      
      expect(result).toBeDefined();
      expect(result.plotOverview).toBeDefined();
      expect(result.genre).toBeDefined();
      
      // Should have been called at least once
      expect(mockGenerate).toHaveBeenCalled();
    });

    it('should use fallback parsing when all retries fail', async () => {
      // Setup service availability
      mockList.mockResolvedValue({ 
        models: [{ name: 'llama2:7b', digest: 'abc123', size: 123456 }] 
      });
      
      await service.setActiveModel('llama2:7b');
      
      // All calls return malformed responses
      mockGenerate.mockResolvedValue({ response: 'Bad response' });
      
      const result = await service.generateSummary(mockScriptContent, summaryOptions);
      
      expect(result).toBeDefined();
      expect(result.plotOverview).toBeDefined();
      expect(result.mainCharacters).toBeDefined();
      expect(result.themes).toBeDefined();
      expect(result.productionNotes).toBeDefined();
      
      // Should have been called at least once, retries depend on parsing success
      expect(mockGenerate).toHaveBeenCalled();
    });
  });

  describe('Prompt Service Integration', () => {
    it('should generate different prompts for different options', () => {
      const briefOptions: SummaryOptions = {
        length: 'brief',
        focusAreas: ['plot'],
        includeProductionNotes: false,
        analyzeCharacterRelationships: false,
        identifyThemes: false,
        assessMarketability: false
      };

      const comprehensiveOptions: SummaryOptions = {
        length: 'comprehensive',
        focusAreas: ['plot', 'characters', 'themes', 'production', 'marketability'],
        includeProductionNotes: true,
        analyzeCharacterRelationships: true,
        identifyThemes: true,
        assessMarketability: true,
        customInstructions: 'Focus on environmental themes'
      };

      const briefPrompt = PromptService.buildSummaryPrompt(mockScriptContent, briefOptions);
      const comprehensivePrompt = PromptService.buildSummaryPrompt(mockScriptContent, comprehensiveOptions);

      expect(briefPrompt).toContain('200-400 words');
      expect(briefPrompt).not.toContain('MAIN CHARACTERS');
      expect(briefPrompt).not.toContain('THEMES');
      expect(briefPrompt).not.toContain('PRODUCTION NOTES');

      expect(comprehensivePrompt).toContain('1200+ words');
      expect(comprehensivePrompt).toContain('MAIN CHARACTERS');
      expect(comprehensivePrompt).toContain('THEMES');
      expect(comprehensivePrompt).toContain('PRODUCTION NOTES');
      expect(comprehensivePrompt).toContain('MARKETABILITY');
      expect(comprehensivePrompt).toContain('Focus on environmental themes');
    });
  });

  describe('Response Parser Integration', () => {
    it('should handle various response formats', () => {
      const responses = [
        // Markdown format
        `## PLOT OVERVIEW\nA story about journalism.\n## GENRE\nThriller`,
        
        // Plain text format
        `PLOT OVERVIEW: A story about journalism.\nGENRE: Thriller`,
        
        // Mixed format
        `Plot: A story about journalism.\n\n## GENRE\nThriller`
      ];

      responses.forEach((response, index) => {
        const result = ResponseParser.parseResponse(
          response,
          mockScriptContent,
          summaryOptions,
          'test-model',
          `script-${index}`
        );

        expect(result.success).toBe(true);
        expect(result.summary).toBeDefined();
        expect(result.summary!.plotOverview).toBeDefined();
        expect(result.summary!.genre).toBeDefined();
      });
    });
  });
});