/**
 * Prompt service for generating structured LLM prompts
 * Requirements: 3.1, 3.3, 7.2
 */

import {
  SummaryOptions,
  FocusArea,
  SummaryLength,
} from '../../types/llm-service';

export class PromptService {
  /**
   * Build a comprehensive summary prompt for script analysis
   */
  static buildSummaryPrompt(content: string, options: SummaryOptions): string {
    const sections = [];

    // Add system instruction
    sections.push(this.getSystemInstruction(options));

    // Add focus area instructions
    if (options.focusAreas.length > 0) {
      sections.push(this.getFocusAreaInstructions(options.focusAreas));
    }

    // Add length and format instructions
    sections.push(this.getLengthInstructions(options.length));
    sections.push(this.getFormatInstructions(options));

    // Add custom instructions if provided
    if (options.customInstructions) {
      sections.push(`Additional Instructions: ${options.customInstructions}`);
    }

    // Add the script content
    sections.push(`\n--- SCRIPT CONTENT ---\n${content}\n--- END SCRIPT ---\n`);

    // Add output format template
    sections.push(this.getOutputTemplate(options));

    return sections.join('\n\n');
  }

  /**
   * Build a prompt for specific script types (feature, short, TV episode, etc.)
   */
  static buildScriptTypePrompt(
    content: string,
    scriptType: string,
    options: SummaryOptions
  ): string {
    const typeSpecificInstructions = this.getScriptTypeInstructions(scriptType);
    const basePrompt = this.buildSummaryPrompt(content, options);

    return `${typeSpecificInstructions}\n\n${basePrompt}`;
  }

  /**
   * Build a prompt for production notes extraction
   */
  static buildProductionNotesPrompt(content: string): string {
    return `
You are a film production expert. Analyze the following script and extract detailed production notes that would be valuable for a director and production team.

Focus on identifying:
1. BUDGET CONSIDERATIONS - Estimate costs for locations, special effects, cast size, etc.
2. LOCATION REQUIREMENTS - Specific locations needed, accessibility, permits required
3. CAST REQUIREMENTS - Number of actors, special skills needed, age ranges
4. TECHNICAL REQUIREMENTS - Equipment, special effects, stunts, vehicles
5. LEGAL CONSIDERATIONS - Rights clearances, permits, safety concerns
6. SCHEDULING CHALLENGES - Weather-dependent scenes, actor availability, complex setups

For each note, categorize it and assign a priority level (critical, high, medium, low).

--- SCRIPT CONTENT ---
${content}
--- END SCRIPT ---

Provide your analysis in the following JSON format:
{
  "productionNotes": [
    {
      "category": "budget|location|cast|technical|legal|scheduling",
      "content": "Detailed description of the production consideration",
      "priority": "critical|high|medium|low",
      "budgetImpact": "minimal|moderate|significant|major",
      "requirements": ["specific requirement 1", "specific requirement 2"]
    }
  ]
}`;
  }

  /**
   * Build a prompt for character analysis
   */
  static buildCharacterAnalysisPrompt(content: string): string {
    return `
You are a script analyst specializing in character development. Analyze the following script and provide detailed character breakdowns.

For each character, identify:
1. NAME - Character's name as it appears in the script
2. DESCRIPTION - Physical description, personality, background
3. IMPORTANCE - Role in the story (protagonist, main, supporting, minor)
4. RELATIONSHIPS - How they relate to other characters
5. CHARACTER ARC - How they change throughout the story
6. AGE RANGE - Approximate age if determinable
7. TRAITS - Key personality traits and characteristics

--- SCRIPT CONTENT ---
${content}
--- END SCRIPT ---

Provide your analysis in the following JSON format:
{
  "characters": [
    {
      "name": "Character Name",
      "description": "Detailed character description",
      "importance": "protagonist|main|supporting|minor",
      "relationships": ["relationship description 1", "relationship description 2"],
      "characterArc": "Description of character development",
      "ageRange": "Age range if determinable",
      "traits": ["trait 1", "trait 2", "trait 3"]
    }
  ]
}`;
  }

  /**
   * Build a prompt for theme identification
   */
  static buildThemeAnalysisPrompt(content: string): string {
    return `
You are a literary analyst specializing in thematic analysis. Analyze the following script and identify its central themes.

Look for:
1. MAJOR THEMES - The primary messages or ideas explored
2. MINOR THEMES - Secondary themes that support the main narrative
3. SYMBOLIC ELEMENTS - Objects, actions, or characters that represent larger ideas
4. SOCIAL COMMENTARY - What the script says about society, human nature, etc.
5. GENRE CONVENTIONS - How the themes relate to the script's genre

--- SCRIPT CONTENT ---
${content}
--- END SCRIPT ---

Provide a list of themes with brief explanations of how they manifest in the script.
Format as a simple JSON array:
{
  "themes": [
    "Theme 1: Brief explanation",
    "Theme 2: Brief explanation",
    "Theme 3: Brief explanation"
  ]
}`;
  }

  private static getSystemInstruction(options: SummaryOptions): string {
    const audience = options.targetAudience || 'film directors and producers';

    return `You are an expert script analyst working for ${audience}. Your task is to provide a comprehensive, professional analysis of the provided script. Be thorough, insightful, and focus on elements that would be most valuable for production decision-making.`;
  }

  private static getFocusAreaInstructions(focusAreas: FocusArea[]): string {
    const areaDescriptions: Record<FocusArea, string> = {
      plot: 'Pay special attention to plot structure, pacing, and narrative coherence',
      characters:
        'Focus on character development, relationships, and casting considerations',
      themes: 'Identify and analyze the central themes and their execution',
      dialogue: 'Evaluate dialogue quality, authenticity, and character voice',
      structure:
        'Analyze the three-act structure, scene transitions, and overall flow',
      genre:
        'Consider genre conventions and how well the script fits its category',
      production:
        'Emphasize production challenges, budget implications, and technical requirements',
      marketability: 'Assess commercial viability and target audience appeal',
      technical:
        'Focus on technical aspects like cinematography opportunities and special effects',
      legal:
        'Identify potential legal issues, rights clearances, and compliance concerns',
    };

    const instructions = focusAreas
      .map(area => areaDescriptions[area])
      .join('. ');
    return `Focus Areas: ${instructions}.`;
  }

  private static getLengthInstructions(length: SummaryLength): string {
    const lengthGuides: Record<SummaryLength, string> = {
      brief:
        'Keep your analysis concise but comprehensive. Aim for 200-400 words total.',
      standard: 'Provide a thorough analysis. Aim for 400-800 words total.',
      detailed:
        'Give an in-depth analysis with specific examples. Aim for 800-1200 words total.',
      comprehensive:
        'Provide exhaustive analysis with detailed examples and insights. Aim for 1200+ words total.',
    };

    return lengthGuides[length];
  }

  private static getFormatInstructions(options: SummaryOptions): string {
    const sections = [];

    sections.push('Structure your response with the following sections:');
    sections.push('1. PLOT OVERVIEW - A concise summary of the story');

    if (options.analyzeCharacterRelationships) {
      sections.push(
        '2. MAIN CHARACTERS - Key characters with descriptions and relationships'
      );
    }

    if (options.identifyThemes) {
      sections.push('3. THEMES - Central themes and their significance');
    }

    if (options.includeProductionNotes) {
      sections.push(
        '4. PRODUCTION NOTES - Budget, location, casting, and technical considerations'
      );
    }

    if (options.assessMarketability) {
      sections.push(
        '5. MARKETABILITY - Commercial potential and target audience'
      );
    }

    sections.push('6. GENRE - Primary genre and any subgenres');
    sections.push(
      '7. TONE AND STYLE - Overall tone, writing style, and atmosphere'
    );

    return sections.join('\n');
  }

  private static getOutputTemplate(options: SummaryOptions): string {
    return `
Please provide your analysis in the following structured format:

## PLOT OVERVIEW
[Comprehensive plot summary]

${
  options.analyzeCharacterRelationships
    ? `## MAIN CHARACTERS
[Character analysis with relationships]

`
    : ''
}${
      options.identifyThemes
        ? `## THEMES
[Theme identification and analysis]

`
        : ''
    }${
      options.includeProductionNotes
        ? `## PRODUCTION NOTES
[Production considerations and challenges]

`
        : ''
    }${
      options.assessMarketability
        ? `## MARKETABILITY
[Commercial viability assessment]

`
        : ''
    }## GENRE
[Genre classification]

## TONE AND STYLE
[Tone and style analysis]

## KEY SCENES
[Notable or pivotal scenes]

${
  options.includeProductionNotes
    ? `## PRODUCTION CHALLENGES
[Specific challenges for production]

`
    : ''
}## OVERALL ASSESSMENT
[Final evaluation and recommendations]`;
  }

  private static getScriptTypeInstructions(scriptType: string): string {
    const typeInstructions: Record<string, string> = {
      feature:
        'This is a feature-length screenplay. Pay attention to three-act structure, character arcs, and commercial viability.',
      short:
        'This is a short film script. Focus on concise storytelling, single themes, and production feasibility for limited budgets.',
      tv_episode:
        'This is a television episode. Consider series continuity, character consistency, and episodic structure.',
      pilot:
        'This is a television pilot. Evaluate world-building, character introductions, and series potential.',
      web_series:
        'This is a web series episode. Consider digital platform requirements and shorter attention spans.',
      documentary:
        'This is a documentary script. Focus on factual accuracy, narrative structure, and interview opportunities.',
      commercial:
        'This is a commercial script. Emphasize brand messaging, target audience, and production efficiency.',
      music_video:
        'This is a music video treatment. Focus on visual storytelling, rhythm, and artistic expression.',
    };

    return (
      typeInstructions[scriptType] ||
      'Analyze this script according to its specific format and intended use.'
    );
  }

  /**
   * Create a prompt for testing LLM responsiveness
   */
  static buildTestPrompt(): string {
    return "Please respond with 'Hello, I am working correctly.' to test the connection.";
  }

  /**
   * Create a prompt for validating structured output
   */
  static buildValidationPrompt(content: string): string {
    return `
Please analyze this brief script excerpt and respond with a simple JSON structure to test structured output:

${content.substring(0, 500)}...

Respond with:
{
  "title": "Estimated title or 'Unknown'",
  "genre": "Primary genre",
  "mainCharacter": "Name of apparent main character",
  "setting": "Primary setting or location",
  "tone": "Overall tone (dramatic, comedic, etc.)"
}`;
  }
}
