/**
 * LLM service interfaces and types
 * Requirements: 1.2, 1.3, 3.1, 7.1, 7.2, 7.4
 */

import { ScriptSummary } from './summary';

export interface LLMService {
  /** Check if the LLM service is available and configured */
  isAvailable(): Promise<boolean>;
  
  /** Generate a summary for the given script content */
  generateSummary(content: string, options: SummaryOptions): Promise<ScriptSummary>;
  
  /** List all available LLM models */
  listAvailableModels(): Promise<LLMModel[]>;
  
  /** Get the currently selected model */
  getCurrentModel(): Promise<LLMModel | null>;
  
  /** Set the active model for processing */
  setActiveModel(modelId: string): Promise<void>;
  
  /** Test the connection and functionality of a model */
  testModel(modelId: string): Promise<ModelTestResult>;
  
  /** Get service status and health information */
  getServiceStatus(): Promise<ServiceStatus>;
  
  /** Cancel an ongoing summary generation */
  cancelGeneration(operationId: string): Promise<void>;
}

export interface SummaryOptions {
  /** Length preference for the summary */
  length: SummaryLength;
  
  /** Areas to focus on during analysis */
  focusAreas: FocusArea[];
  
  /** Target audience for the summary */
  targetAudience?: string;
  
  /** Specific instructions for the LLM */
  customInstructions?: string;
  
  /** Whether to include production notes */
  includeProductionNotes: boolean;
  
  /** Whether to analyze character relationships */
  analyzeCharacterRelationships: boolean;
  
  /** Whether to identify themes */
  identifyThemes: boolean;
  
  /** Whether to assess commercial viability */
  assessMarketability: boolean;
  
  /** Temperature setting for LLM creativity (0-1) */
  temperature?: number;
  
  /** Maximum tokens for the response */
  maxTokens?: number;
}

export interface LLMModel {
  /** Unique identifier for the model */
  id: string;
  
  /** Display name of the model */
  name: string;
  
  /** Model description */
  description: string;
  
  /** Model version */
  version: string;
  
  /** Model size in parameters */
  parameterCount?: string;
  
  /** Whether the model is currently available */
  isAvailable: boolean;
  
  /** Whether the model is downloaded locally */
  isDownloaded: boolean;
  
  /** Model capabilities */
  capabilities: ModelCapability[];
  
  /** Performance characteristics */
  performance: ModelPerformance;
  
  /** Resource requirements */
  requirements: ModelRequirements;
}

export interface ModelTestResult {
  /** Whether the test was successful */
  success: boolean;
  
  /** Test response time in milliseconds */
  responseTime: number;
  
  /** Quality score of the test response (0-1) */
  qualityScore?: number;
  
  /** Error message if test failed */
  error?: string;
  
  /** Test output sample */
  sampleOutput?: string;
}

export interface ServiceStatus {
  /** Whether the service is running */
  isRunning: boolean;
  
  /** Service version */
  version: string;
  
  /** Available models count */
  availableModels: number;
  
  /** Current memory usage */
  memoryUsage?: MemoryUsage;
  
  /** Last health check timestamp */
  lastHealthCheck: Date;
  
  /** Any service warnings or issues */
  warnings: string[];
}

export interface ModelPerformance {
  /** Average response time in milliseconds */
  averageResponseTime: number;
  
  /** Quality rating (1-5) */
  qualityRating: number;
  
  /** Memory efficiency rating (1-5) */
  memoryEfficiency: number;
  
  /** Speed rating (1-5) */
  speedRating: number;
}

export interface ModelRequirements {
  /** Minimum RAM required in GB */
  minMemoryGB: number;
  
  /** Recommended RAM in GB */
  recommendedMemoryGB: number;
  
  /** Disk space required in GB */
  diskSpaceGB: number;
  
  /** Whether GPU acceleration is supported */
  supportsGPU: boolean;
  
  /** Minimum CPU cores recommended */
  minCPUCores: number;
}

export interface MemoryUsage {
  /** Used memory in bytes */
  used: number;
  
  /** Total available memory in bytes */
  total: number;
  
  /** Memory usage percentage */
  percentage: number;
}

export type SummaryLength = 'brief' | 'standard' | 'detailed' | 'comprehensive';

export type FocusArea =
  | 'plot'
  | 'characters'
  | 'themes'
  | 'dialogue'
  | 'structure'
  | 'genre'
  | 'production'
  | 'marketability'
  | 'technical'
  | 'legal';

export type ModelCapability =
  | 'text_analysis'
  | 'creative_writing'
  | 'structured_output'
  | 'long_context'
  | 'multilingual'
  | 'code_understanding';

export interface GenerationProgress {
  /** Unique identifier for the operation */
  operationId: string;
  
  /** Current progress percentage (0-100) */
  progress: number;
  
  /** Current processing stage */
  stage: GenerationStage;
  
  /** Status message */
  message: string;
  
  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining?: number;
  
  /** Whether the operation can be cancelled */
  cancellable: boolean;
}

export type GenerationStage =
  | 'initializing'
  | 'analyzing_content'
  | 'extracting_plot'
  | 'identifying_characters'
  | 'analyzing_themes'
  | 'generating_production_notes'
  | 'finalizing'
  | 'complete'
  | 'error'
  | 'cancelled';