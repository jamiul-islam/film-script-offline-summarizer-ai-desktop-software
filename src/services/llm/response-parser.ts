/**
 * Response parser for processing LLM responses into structured data
 * Requirements: 3.1, 3.2, 3.3
 */

import { ScriptSummary, Character, ProductionNote, CharacterImportance, ProductionCategory, Priority, BudgetImpact } from '../../types/summary';
import { SummaryOptions } from '../../types/llm-service';

export interface ParsedResponse {
  success: boolean;
  summary?: ScriptSummary;
  error?: string;
  warnings?: string[];
}

export class ResponseParser {
  /**
   * Parse LLM response into structured ScriptSummary object
   */
  static parseResponse(
    response: string,
    originalContent: string,
    options: SummaryOptions,
    modelUsed: string,
    scriptId?: string
  ): ParsedResponse {
    try {
      const warnings: string[] = [];
      
      // Clean and normalize the response
      const cleanedResponse = this.cleanResponse(response);
      
      // Extract sections from the response
      const sections = this.extractSections(cleanedResponse);
      
      // Parse each section
      const plotOverview = this.extractPlotOverview(sections, warnings);
      const mainCharacters = this.extractCharacters(sections, warnings);
      const themes = this.extractThemes(sections, warnings);
      const productionNotes = this.extractProductionNotes(sections, warnings);
      const genre = this.extractGenre(sections, warnings);
      const estimatedBudget = this.extractBudgetCategory(sections);
      const targetAudience = this.extractTargetAudience(sections);
      const toneAndStyle = this.extractToneAndStyle(sections);
      const keyScenes = this.extractKeyScenes(sections);
      const productionChallenges = this.extractProductionChallenges(sections);
      const marketability = this.extractMarketability(sections);

      // Create the summary object
      const summary: ScriptSummary = {
        id: `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scriptId: scriptId || `script_${Date.now()}`,
        plotOverview,
        mainCharacters,
        themes,
        productionNotes,
        genre,
        estimatedBudget,
        targetAudience,
        toneAndStyle,
        keyScenes,
        productionChallenges,
        marketability,
        modelUsed,
        generationOptions: options,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return {
        success: true,
        summary,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse response: ${error.message}`
      };
    }
  }

  /**
   * Parse JSON response for structured data (production notes, characters, themes)
   */
  static parseJsonResponse<T>(response: string, expectedStructure: string): { success: boolean; data?: T; error?: string } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: false,
          error: 'No JSON structure found in response'
        };
      }

      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      return {
        success: true,
        data: parsed as T
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse JSON: ${error.message}`
      };
    }
  }

  /**
   * Validate and retry parsing with fallback strategies
   */
  static parseWithRetry(
    response: string,
    originalContent: string,
    options: SummaryOptions,
    modelUsed: string,
    scriptId?: string,
    retryCount: number = 0
  ): ParsedResponse {
    const result = this.parseResponse(response, originalContent, options, modelUsed, scriptId);
    
    if (result.success) {
      return result;
    }

    // If parsing failed and we haven't retried too many times, try fallback parsing
    if (retryCount < 2) {
      return this.parseWithFallback(response, originalContent, options, modelUsed, scriptId);
    }

    return result;
  }

  private static cleanResponse(response: string): string {
    // Remove common LLM artifacts and normalize formatting
    return response
      .replace(/^(Here's|Here is|Based on|Analysis:)/i, '')
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/^\s*[-*]\s*/gm, '') // Remove bullet points
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();
  }

  private static extractSections(response: string): Record<string, string> {
    const sections: Record<string, string> = {};
    
    // Define section patterns
    const sectionPatterns = [
      'PLOT OVERVIEW',
      'MAIN CHARACTERS',
      'THEMES',
      'PRODUCTION NOTES',
      'MARKETABILITY',
      'GENRE',
      'TONE AND STYLE',
      'KEY SCENES',
      'PRODUCTION CHALLENGES',
      'OVERALL ASSESSMENT'
    ];

    // Split response into sections
    let currentSection = 'general';
    let currentContent = '';
    
    const lines = response.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if this line is a section header
      const matchedSection = sectionPatterns.find(pattern => 
        trimmedLine.toUpperCase().includes(pattern) ||
        trimmedLine.match(new RegExp(`^#{1,3}\\s*${pattern}`, 'i'))
      );
      
      if (matchedSection) {
        // Save previous section
        if (currentContent.trim()) {
          sections[currentSection] = currentContent.trim();
        }
        
        // Start new section
        currentSection = matchedSection.toLowerCase().replace(/\s+/g, '_');
        currentContent = '';
      } else {
        currentContent += line + '\n';
      }
    }
    
    // Save the last section
    if (currentContent.trim()) {
      sections[currentSection] = currentContent.trim();
    }
    
    return sections;
  }

  private static extractPlotOverview(sections: Record<string, string>, warnings: string[]): string {
    const plotSection = sections['plot_overview'] || sections['general'] || '';
    
    if (!plotSection) {
      warnings.push('No plot overview found in response');
      return 'Plot overview not available';
    }
    
    // Extract the first substantial paragraph as plot overview
    const paragraphs = plotSection.split('\n\n').filter(p => p.trim().length > 50);
    
    if (paragraphs.length === 0) {
      warnings.push('Plot overview appears to be too brief');
      return plotSection.substring(0, 500);
    }
    
    return paragraphs[0].trim();
  }

  private static extractCharacters(sections: Record<string, string>, warnings: string[]): Character[] {
    const characterSection = sections['main_characters'] || '';
    
    if (!characterSection) {
      warnings.push('No character information found in response');
      return [];
    }
    
    const characters: Character[] = [];
    
    // Split by lines and look for character entries
    const lines = characterSection.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 10) {
        const character = this.parseCharacterBlock(trimmedLine);
        if (character) {
          characters.push(character);
        }
      }
    }
    
    if (characters.length === 0) {
      warnings.push('Could not parse character information from response');
    }
    
    return characters;
  }

  private static parseCharacterBlock(block: string): Character | null {
    if (block.length < 10) return null;
    
    // Extract character name (usually at the beginning)
    const nameMatch = block.match(/^(?:\d+\.?\s*)?([A-Z][A-Z\s]*[A-Z])(?:\s*[-:]|\s|$)/);
    if (!nameMatch) return null;
    
    const name = nameMatch[1].trim();
    
    // Extract description (everything after the name and separator)
    const description = block.replace(/^(?:\d+\.?\s*)?[A-Z][A-Z\s]*[A-Z](?:\s*[-:]|\s)/, '').trim();
    
    // Determine importance based on keywords (order matters - most specific first)
    let importance: CharacterImportance = 'minor';
    const lowerBlock = block.toLowerCase();
    if (lowerBlock.includes('protagonist') || lowerBlock.includes('main character')) {
      importance = 'protagonist';
    } else if (lowerBlock.includes('supporting')) {
      importance = 'supporting';
    } else if (lowerBlock.includes('main') || lowerBlock.includes('lead')) {
      importance = 'main';
    }
    
    return {
      name,
      description: description.substring(0, 500),
      importance,
      relationships: [],
      characterArc: undefined,
      ageRange: undefined,
      traits: []
    };
  }

  private static extractThemes(sections: Record<string, string>, warnings: string[]): string[] {
    const themeSection = sections['themes'] || '';
    
    if (!themeSection) {
      warnings.push('No theme information found in response');
      return [];
    }
    
    // Extract themes from bullet points or numbered lists
    const themes: string[] = [];
    const lines = themeSection.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 10) {
        // Remove bullet points, numbers, and other list markers
        const cleanTheme = trimmedLine
          .replace(/^[-*•]\s*/, '')
          .replace(/^\d+\.?\s*/, '')
          .trim();
        
        if (cleanTheme.length > 5) {
          themes.push(cleanTheme);
        }
      }
    }
    
    return themes.slice(0, 10); // Limit to 10 themes
  }

  private static extractProductionNotes(sections: Record<string, string>, warnings: string[]): ProductionNote[] {
    const productionSection = sections['production_notes'] || sections['production_challenges'] || '';
    
    if (!productionSection) {
      warnings.push('No production notes found in response');
      return [];
    }
    
    const notes: ProductionNote[] = [];
    const lines = productionSection.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 20) {
        const note = this.parseProductionNote(trimmedLine);
        if (note) {
          notes.push(note);
        }
      }
    }
    
    return notes.slice(0, 20); // Limit to 20 notes
  }

  private static parseProductionNote(text: string): ProductionNote | null {
    if (text.length < 10) return null;
    
    // Clean the text
    const cleanText = text.replace(/^[-*•]\s*/, '').replace(/^\d+\.?\s*/, '').trim();
    
    // Determine category based on keywords
    let category: ProductionCategory = 'technical';
    const lowerText = cleanText.toLowerCase();
    
    if (lowerText.includes('budget') || lowerText.includes('cost') || lowerText.includes('expensive')) {
      category = 'budget';
    } else if (lowerText.includes('location') || lowerText.includes('setting') || lowerText.includes('venue')) {
      category = 'location';
    } else if (lowerText.includes('cast') || lowerText.includes('actor') || lowerText.includes('performer')) {
      category = 'cast';
    } else if (lowerText.includes('legal') || lowerText.includes('permit') || lowerText.includes('rights')) {
      category = 'legal';
    } else if (lowerText.includes('schedule') || lowerText.includes('timing') || lowerText.includes('deadline')) {
      category = 'scheduling';
    } else if (lowerText.includes('equipment') || lowerText.includes('camera') || lowerText.includes('gear')) {
      category = 'equipment';
    } else if (lowerText.includes('post') || lowerText.includes('edit') || lowerText.includes('vfx')) {
      category = 'post-production';
    }
    
    // Determine priority
    let priority: Priority = 'medium';
    if (lowerText.includes('critical') || lowerText.includes('essential') || lowerText.includes('must')) {
      priority = 'critical';
    } else if (lowerText.includes('important') || lowerText.includes('high') || lowerText.includes('significant')) {
      priority = 'high';
    } else if (lowerText.includes('minor') || lowerText.includes('low') || lowerText.includes('optional')) {
      priority = 'low';
    }
    
    // Determine budget impact
    let budgetImpact: BudgetImpact = 'moderate';
    if (lowerText.includes('expensive') || lowerText.includes('costly') || lowerText.includes('major cost')) {
      budgetImpact = 'major';
    } else if (lowerText.includes('significant cost') || lowerText.includes('substantial')) {
      budgetImpact = 'significant';
    } else if (lowerText.includes('minimal cost') || lowerText.includes('cheap') || lowerText.includes('low cost')) {
      budgetImpact = 'minimal';
    }
    
    return {
      category,
      content: cleanText.substring(0, 500),
      priority,
      budgetImpact,
      requirements: []
    };
  }

  private static extractGenre(sections: Record<string, string>, warnings: string[]): string {
    const genreSection = sections['genre'] || sections['general'] || '';
    
    // Look for genre keywords
    const genreKeywords = [
      'drama', 'comedy', 'thriller', 'horror', 'action', 'romance', 'sci-fi', 'science fiction',
      'fantasy', 'mystery', 'crime', 'documentary', 'biographical', 'historical', 'western',
      'musical', 'animation', 'adventure', 'family', 'war', 'sports'
    ];
    
    const lowerSection = genreSection.toLowerCase();
    const foundGenres = genreKeywords.filter(genre => lowerSection.includes(genre));
    
    if (foundGenres.length > 0) {
      return foundGenres[0].charAt(0).toUpperCase() + foundGenres[0].slice(1);
    }
    
    warnings.push('Could not determine genre from response');
    return 'Unknown';
  }

  private static extractBudgetCategory(sections: Record<string, string>) {
    const budgetSection = (sections['production_notes'] || sections['general'] || '').toLowerCase();
    
    if (budgetSection.includes('blockbuster') || budgetSection.includes('major studio')) {
      return 'blockbuster';
    } else if (budgetSection.includes('high budget') || budgetSection.includes('expensive')) {
      return 'high';
    } else if (budgetSection.includes('medium budget') || budgetSection.includes('moderate cost')) {
      return 'medium';
    } else if (budgetSection.includes('low budget') || budgetSection.includes('independent')) {
      return 'low';
    } else if (budgetSection.includes('micro budget') || budgetSection.includes('very low cost')) {
      return 'micro';
    }
    
    return undefined;
  }

  private static extractTargetAudience(sections: Record<string, string>): string | undefined {
    const marketSection = sections['marketability'] || sections['general'] || '';
    
    // Look for audience mentions
    const audienceMatch = marketSection.match(/(?:target audience|aimed at|appeals to|audience of)\s*:?\s*([^.\n]+)/i);
    
    if (audienceMatch) {
      return audienceMatch[1].trim().substring(0, 200);
    }
    
    return undefined;
  }

  private static extractToneAndStyle(sections: Record<string, string>): string | undefined {
    const toneSection = sections['tone_and_style'] || sections['general'] || '';
    
    if (toneSection.length > 20) {
      return toneSection.substring(0, 300);
    }
    
    return undefined;
  }

  private static extractKeyScenes(sections: Record<string, string>): string[] | undefined {
    const sceneSection = sections['key_scenes'] || '';
    
    if (!sceneSection) return undefined;
    
    const scenes: string[] = [];
    const lines = sceneSection.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 20) {
        const cleanScene = trimmedLine.replace(/^[-*•]\s*/, '').replace(/^\d+\.?\s*/, '').trim();
        if (cleanScene.length > 10) {
          scenes.push(cleanScene.substring(0, 200));
        }
      }
    }
    
    return scenes.length > 0 ? scenes.slice(0, 10) : undefined;
  }

  private static extractProductionChallenges(sections: Record<string, string>): string[] | undefined {
    const challengeSection = sections['production_challenges'] || '';
    
    if (!challengeSection) return undefined;
    
    const challenges: string[] = [];
    const lines = challengeSection.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 20) {
        const cleanChallenge = trimmedLine.replace(/^[-*•]\s*/, '').replace(/^\d+\.?\s*/, '').trim();
        if (cleanChallenge.length > 10) {
          challenges.push(cleanChallenge.substring(0, 200));
        }
      }
    }
    
    return challenges.length > 0 ? challenges.slice(0, 10) : undefined;
  }

  private static extractMarketability(sections: Record<string, string>): string | undefined {
    const marketSection = sections['marketability'] || '';
    
    if (marketSection.length > 20) {
      return marketSection.substring(0, 500);
    }
    
    return undefined;
  }

  private static parseWithFallback(
    response: string,
    originalContent: string,
    options: SummaryOptions,
    modelUsed: string,
    scriptId?: string
  ): ParsedResponse {
    // Fallback parsing strategy - create a basic summary from whatever we can extract
    try {
      const warnings = ['Used fallback parsing due to response format issues'];
      
      // Extract basic plot from the beginning of the response
      const plotOverview = response.substring(0, 500).trim() || 'Summary not available';
      
      // Try to find character names in the original content
      const characterNames = this.extractCharacterNamesFromScript(originalContent);
      const mainCharacters = characterNames.map(name => ({
        name,
        description: 'Character details not available',
        importance: 'minor' as CharacterImportance,
        relationships: []
      }));
      
      const summary: ScriptSummary = {
        id: `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scriptId: scriptId || `script_${Date.now()}`,
        plotOverview,
        mainCharacters,
        themes: [],
        productionNotes: [],
        genre: 'Unknown',
        modelUsed,
        generationOptions: options,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return {
        success: true,
        summary,
        warnings
      };
    } catch (error) {
      return {
        success: false,
        error: `Fallback parsing also failed: ${error.message}`
      };
    }
  }

  private static extractCharacterNamesFromScript(content: string): string[] {
    // Extract character names from script format (usually in ALL CAPS)
    const characterPattern = /^([A-Z][A-Z\s]{2,}?)(?:\s*\(|:)/gm;
    const matches = content.match(characterPattern);
    
    if (!matches) return [];
    
    const names = matches
      .map(match => match.replace(/[:(].*$/, '').trim())
      .filter(name => name.length > 1 && name.length < 30)
      .filter((name, index, arr) => arr.indexOf(name) === index) // Remove duplicates
      .slice(0, 10); // Limit to 10 characters
    
    return names;
  }
}