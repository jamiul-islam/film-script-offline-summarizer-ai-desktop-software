/**
 * Script summary and analysis data models
 * Requirements: 3.1, 3.3, 4.1, 4.2
 */

export interface ScriptSummary {
  /** Unique identifier for the summary */
  id: string;
  /** Reference to the script this summary belongs to */
  scriptId: string;
  /** High-level plot overview */
  plotOverview: string;
  /** List of main characters with descriptions */
  mainCharacters: Character[];
  /** Central themes identified in the script */
  themes: string[];
  /** Production-related notes and considerations */
  productionNotes: ProductionNote[];
  /** Identified genre of the script */
  genre: string;
  /** Estimated budget category if determinable */
  estimatedBudget?: BudgetCategory;
  /** Target audience information */
  targetAudience?: string;
  /** Tone and style description */
  toneAndStyle?: string;
  /** Key scenes or moments */
  keyScenes?: string[];
  /** Potential challenges for production */
  productionChallenges?: string[];
  /** Commercial viability assessment */
  marketability?: string;
  /** LLM model used for generation */
  modelUsed: string;
  /** Summary generation options used */
  generationOptions: SummaryOptions;
  /** When the summary was generated */
  createdAt: Date;
  /** When the summary was last updated */
  updatedAt: Date;
}

export interface Character {
  /** Character name */
  name: string;
  /** Character description and role */
  description: string;
  /** Importance level in the story */
  importance: CharacterImportance;
  /** Relationships with other characters */
  relationships: string[];
  /** Character arc or development notes */
  characterArc?: string;
  /** Age range if specified */
  ageRange?: string;
  /** Notable traits or characteristics */
  traits?: string[];
}

export interface ProductionNote {
  /** Category of the production note */
  category: ProductionCategory;
  /** Content of the note */
  content: string;
  /** Priority level for consideration */
  priority: Priority;
  /** Estimated impact on budget */
  budgetImpact?: BudgetImpact;
  /** Specific requirements or constraints */
  requirements?: string[];
}

export type CharacterImportance =
  | 'protagonist'
  | 'main'
  | 'supporting'
  | 'minor';

export type ProductionCategory =
  | 'budget'
  | 'location'
  | 'cast'
  | 'technical'
  | 'legal'
  | 'scheduling'
  | 'equipment'
  | 'post-production';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type BudgetCategory =
  | 'micro'
  | 'low'
  | 'medium'
  | 'high'
  | 'blockbuster';

export type BudgetImpact = 'minimal' | 'moderate' | 'significant' | 'major';

// Import SummaryOptions type (will be defined in llm-service.ts)
export type { SummaryOptions } from './llm-service';
