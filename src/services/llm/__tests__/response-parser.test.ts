/**
 * Unit tests for ResponseParser
 * Requirements: 3.1, 3.2, 3.3
 */

import { describe, it, expect } from 'vitest';
import { ResponseParser } from '../response-parser';
import { SummaryOptions } from '../../../types/llm-service';

describe('ResponseParser', () => {
  const mockSummaryOptions: SummaryOptions = {
    length: 'standard',
    focusAreas: ['plot', 'characters'],
    includeProductionNotes: true,
    analyzeCharacterRelationships: true,
    identifyThemes: true,
    assessMarketability: false
  };

  const mockScriptContent = `
FADE IN:

EXT. COFFEE SHOP - DAY

SARAH (25), a determined journalist, sits across from MIKE (30), a whistleblower.

SARAH
You're sure about this information?

MIKE
I've been working there for five years. I know what I saw.

FADE OUT.
`;

  describe('parseResponse', () => {
    it('should parse a well-structured response', () => {
      const mockResponse = `
## PLOT OVERVIEW
A journalist meets with a whistleblower to expose corporate corruption. The story follows their dangerous investigation as they uncover a conspiracy that threatens their lives.

## MAIN CHARACTERS
SARAH - A 25-year-old determined journalist who risks everything for the truth. She is the protagonist of the story.
MIKE - A 30-year-old whistleblower who has inside information about corporate wrongdoing. He is a main character.

## THEMES
- Truth vs. Power
- Courage in the face of danger
- Corporate corruption

## PRODUCTION NOTES
- Location: Coffee shop scenes will require permits for filming
- Cast: Two main actors needed with strong dramatic skills
- Budget: Moderate budget required for multiple locations

## GENRE
Thriller

## TONE AND STYLE
Dark and suspenseful with realistic dialogue
`;

      const result = ResponseParser.parseResponse(
        mockResponse,
        mockScriptContent,
        mockSummaryOptions,
        'test-model',
        'test-script-id'
      );

      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.summary!.plotOverview).toContain('journalist meets with a whistleblower');
      expect(result.summary!.mainCharacters).toHaveLength(2);
      expect(result.summary!.mainCharacters[0].name).toBe('SARAH');
      expect(result.summary!.mainCharacters[0].importance).toBe('protagonist');
      expect(result.summary!.themes).toHaveLength(3);
      expect(result.summary!.themes[0]).toBe('Truth vs. Power');
      expect(result.summary!.productionNotes).toHaveLength(3);
      expect(result.summary!.genre).toBe('Thriller');
      expect(result.summary!.toneAndStyle).toContain('Dark and suspenseful');
      expect(result.summary!.modelUsed).toBe('test-model');
      expect(result.summary!.scriptId).toBe('test-script-id');
    });

    it('should handle malformed responses gracefully', () => {
      const malformedResponse = 'This is just a plain text response without any structure.';

      const result = ResponseParser.parseResponse(
        malformedResponse,
        mockScriptContent,
        mockSummaryOptions,
        'test-model'
      );

      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.summary!.plotOverview).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
    });

    it('should extract character names from script when response lacks character info', () => {
      const responseWithoutCharacters = `
## PLOT OVERVIEW
A story about people talking.

## GENRE
Drama
`;

      const result = ResponseParser.parseResponse(
        responseWithoutCharacters,
        mockScriptContent,
        mockSummaryOptions,
        'test-model'
      );

      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.warnings).toContain('No character information found in response');
    });

    it('should handle empty or very short responses', () => {
      const shortResponse = 'Short response.';

      const result = ResponseParser.parseResponse(
        shortResponse,
        mockScriptContent,
        mockSummaryOptions,
        'test-model'
      );

      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.summary!.plotOverview).toBeDefined();
    });

    it('should categorize production notes correctly', () => {
      const responseWithProductionNotes = `
## PRODUCTION NOTES
- Budget: This will be expensive to film due to multiple locations
- Location: Filming permits required for coffee shop scenes
- Cast: Need experienced actors for dramatic scenes
- Technical: Special lighting equipment needed for night scenes
- Legal: Rights clearance needed for background music
- Scheduling: Weather-dependent outdoor scenes
`;

      const result = ResponseParser.parseResponse(
        responseWithProductionNotes,
        mockScriptContent,
        mockSummaryOptions,
        'test-model'
      );

      expect(result.success).toBe(true);
      expect(result.summary!.productionNotes).toHaveLength(6);
      
      const budgetNote = result.summary!.productionNotes.find(note => note.category === 'budget');
      expect(budgetNote).toBeDefined();
      expect(budgetNote!.budgetImpact).toBe('major');
      
      const locationNote = result.summary!.productionNotes.find(note => note.category === 'location');
      expect(locationNote).toBeDefined();
      
      const castNote = result.summary!.productionNotes.find(note => note.category === 'cast');
      expect(castNote).toBeDefined();
    });

    it('should determine genre from content', () => {
      const horrorResponse = `
## PLOT OVERVIEW
A terrifying story about supernatural events.

## GENRE
This is clearly a horror film with supernatural elements.
`;

      const result = ResponseParser.parseResponse(
        horrorResponse,
        mockScriptContent,
        mockSummaryOptions,
        'test-model'
      );

      expect(result.success).toBe(true);
      expect(result.summary!.genre).toBe('Horror');
    });

    it('should extract budget category when mentioned', () => {
      const budgetResponse = `
## PRODUCTION NOTES
This is a low budget independent film that can be made for under $100,000.
`;

      const result = ResponseParser.parseResponse(
        budgetResponse,
        mockScriptContent,
        mockSummaryOptions,
        'test-model'
      );

      expect(result.success).toBe(true);
      expect(result.summary!.estimatedBudget).toBe('low');
    });
  });

  describe('parseJsonResponse', () => {
    it('should parse valid JSON from response', () => {
      const jsonResponse = `
Here is the analysis:

{
  "characters": [
    {
      "name": "Sarah",
      "description": "A journalist",
      "importance": "protagonist"
    }
  ]
}

That's the complete analysis.
`;

      const result = ResponseParser.parseJsonResponse(jsonResponse, 'characters');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('characters');
    });

    it('should handle responses without JSON', () => {
      const noJsonResponse = 'This response has no JSON structure at all.';

      const result = ResponseParser.parseJsonResponse(noJsonResponse, 'characters');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No JSON structure found');
    });

    it('should handle malformed JSON', () => {
      const malformedJsonResponse = `
{
  "characters": [
    {
      "name": "Sarah",
      "description": "A journalist",
      "invalid": 
    }
  ]
}`;

      const result = ResponseParser.parseJsonResponse(malformedJsonResponse, 'characters');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse JSON');
    });
  });

  describe('parseWithRetry', () => {
    it('should succeed on first attempt with good response', () => {
      const goodResponse = `
## PLOT OVERVIEW
A well-structured story about journalism and corruption.

## GENRE
Thriller
`;

      const result = ResponseParser.parseWithRetry(
        goodResponse,
        mockScriptContent,
        mockSummaryOptions,
        'test-model',
        'test-script-id',
        0
      );

      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
    });

    it('should use fallback parsing for problematic responses', () => {
      const problematicResponse = '';

      const result = ResponseParser.parseWithRetry(
        problematicResponse,
        mockScriptContent,
        mockSummaryOptions,
        'test-model',
        'test-script-id',
        2 // Use retry count that triggers fallback
      );

      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
      // Just check that we have warnings, which indicates some parsing issues
      expect(result.summary!.plotOverview).toBeDefined();
    });
  });

  describe('character importance detection', () => {
    it('should correctly identify character importance levels', () => {
      const characterResponse = `
## MAIN CHARACTERS
JOHN - The protagonist of the story, a detective investigating the case.
MARY - A main supporting character who helps John solve the mystery.
BOB - A supporting character who provides information.
CLERK - A minor character who appears in one scene.
`;

      const result = ResponseParser.parseResponse(
        characterResponse,
        mockScriptContent,
        mockSummaryOptions,
        'test-model'
      );

      expect(result.success).toBe(true);
      expect(result.summary!.mainCharacters).toHaveLength(4);
      
      const john = result.summary!.mainCharacters.find(c => c.name === 'JOHN');
      expect(john?.importance).toBe('protagonist');
      
      const mary = result.summary!.mainCharacters.find(c => c.name === 'MARY');
      expect(mary?.importance).toBe('supporting');
      
      const bob = result.summary!.mainCharacters.find(c => c.name === 'BOB');
      expect(bob?.importance).toBe('supporting');
      
      const clerk = result.summary!.mainCharacters.find(c => c.name === 'CLERK');
      expect(clerk?.importance).toBe('minor');
    });
  });

  describe('production note priority detection', () => {
    it('should correctly assign priorities to production notes', () => {
      const productionResponse = `
## PRODUCTION NOTES
- Critical safety equipment must be used for stunt scenes
- Important to get permits for location filming
- Medium priority: Additional lighting equipment would be helpful
- Low priority: Optional background music could enhance scenes
`;

      const result = ResponseParser.parseResponse(
        productionResponse,
        mockScriptContent,
        mockSummaryOptions,
        'test-model'
      );

      expect(result.success).toBe(true);
      expect(result.summary!.productionNotes).toHaveLength(4);
      
      const criticalNote = result.summary!.productionNotes.find(note => 
        note.content.includes('Critical safety')
      );
      expect(criticalNote?.priority).toBe('critical');
      
      const importantNote = result.summary!.productionNotes.find(note => 
        note.content.includes('Important to get')
      );
      expect(importantNote?.priority).toBe('high');
      
      const lowNote = result.summary!.productionNotes.find(note => 
        note.content.includes('Low priority')
      );
      expect(lowNote?.priority).toBe('low');
    });
  });

  describe('theme extraction', () => {
    it('should extract themes from various formats', () => {
      const themeResponse = `
## THEMES
1. Justice vs. Corruption
2. The power of truth
- Personal sacrifice for greater good
• Media responsibility
`;

      const result = ResponseParser.parseResponse(
        themeResponse,
        mockScriptContent,
        mockSummaryOptions,
        'test-model'
      );

      expect(result.success).toBe(true);
      expect(result.summary!.themes).toHaveLength(4);
      expect(result.summary!.themes).toContain('Justice vs. Corruption');
      expect(result.summary!.themes).toContain('The power of truth');
      expect(result.summary!.themes).toContain('Personal sacrifice for greater good');
      expect(result.summary!.themes).toContain('Media responsibility');
    });
  });
});