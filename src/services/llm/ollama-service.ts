/**
 * Ollama LLM service implementation
 * Requirements: 1.2, 1.3, 7.1, 7.4
 */

import { Ollama } from 'ollama';
import {
  LLMService,
  LLMModel,
  SummaryOptions,
  ModelTestResult,
  ServiceStatus,
  ModelCapability,
  ModelPerformance,
  ModelRequirements,
  MemoryUsage,
  GenerationProgress,
  GenerationStage,
} from '../../types/llm-service';
import { ScriptSummary } from '../../types/summary';
import { PromptService } from './prompt-service';
import { ResponseParser } from './response-parser';

export class OllamaService implements LLMService {
  private ollama: Ollama;
  private currentModel: string | null = null;
  private activeOperations = new Map<string, AbortController>();

  constructor(baseUrl = 'http://localhost:11434', ollamaInstance?: Ollama) {
    this.ollama = ollamaInstance || new Ollama({ host: baseUrl });
    // Set default model from environment variable
    this.currentModel = process.env.DEFAULT_MODEL || null;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const status = await this.getServiceStatus();
      return status.isRunning;
    } catch (error) {
      console.error('Ollama service availability check failed:', error);
      return false;
    }
  }

  async generateSummary(
    content: string,
    options: SummaryOptions,
    scriptId?: string
  ): Promise<ScriptSummary> {
    if (!(await this.isAvailable())) {
      throw new Error('Ollama service is not available');
    }

    if (!this.currentModel) {
      throw new Error('No model selected. Please set an active model first.');
    }

    const operationId = this.generateOperationId();
    const abortController = new AbortController();
    this.activeOperations.set(operationId, abortController);

    try {
      return await this.generateSummaryWithRetry(content, options, scriptId, 0);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Summary generation was cancelled');
      }
      throw new Error(`Failed to generate summary: ${error.message}`);
    } finally {
      this.activeOperations.delete(operationId);
    }
  }

  private async generateSummaryWithRetry(
    content: string,
    options: SummaryOptions,
    scriptId?: string,
    retryCount = 0
  ): Promise<ScriptSummary> {
    const maxRetries = 3;

    try {
      const prompt = this.buildSummaryPrompt(content, options);

      const response = await this.ollama.generate({
        model: this.currentModel!,
        prompt,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 2000,
        },
        stream: false,
      });

      // Parse the response into structured summary
      const parseResult = ResponseParser.parseWithRetry(
        response.response,
        content,
        options,
        this.currentModel!,
        scriptId,
        retryCount
      );

      if (!parseResult.success) {
        if (retryCount < maxRetries) {
          console.warn(
            `Parsing failed, retrying (${retryCount + 1}/${maxRetries}): ${parseResult.error}`
          );
          return await this.generateSummaryWithRetry(
            content,
            options,
            scriptId,
            retryCount + 1
          );
        }
        throw new Error(
          parseResult.error || 'Failed to parse LLM response after retries'
        );
      }

      return parseResult.summary!;
    } catch (error) {
      if (retryCount < maxRetries && !error.message.includes('cancelled')) {
        console.warn(
          `Generation failed, retrying (${retryCount + 1}/${maxRetries}): ${error.message}`
        );
        // Wait a bit before retrying (shorter delay in tests)
        const delay =
          process.env.NODE_ENV === 'test' ? 10 : 1000 * (retryCount + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return await this.generateSummaryWithRetry(
          content,
          options,
          scriptId,
          retryCount + 1
        );
      }
      throw error;
    }
  }

  async listAvailableModels(): Promise<LLMModel[]> {
    try {
      const response = await this.ollama.list();

      return response.models.map(model => ({
        id: model.name,
        name: model.name,
        description: `Ollama model: ${model.name}`,
        version: model.digest.substring(0, 12),
        parameterCount: this.estimateParameterCount(model.name),
        isAvailable: true,
        isDownloaded: true,
        capabilities: this.getModelCapabilities(model.name),
        performance: this.getModelPerformance(model.name),
        requirements: this.getModelRequirements(model.name),
      }));
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }

  async getCurrentModel(): Promise<LLMModel | null> {
    if (!this.currentModel) {
      return null;
    }

    const models = await this.listAvailableModels();
    return models.find(model => model.id === this.currentModel) || null;
  }

  async setActiveModel(modelId: string): Promise<void> {
    const models = await this.listAvailableModels();
    const model = models.find(m => m.id === modelId);

    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (!model.isAvailable) {
      throw new Error(`Model ${modelId} is not available`);
    }

    this.currentModel = modelId;
  }

  async testModel(modelId: string): Promise<ModelTestResult> {
    const startTime = Date.now();

    try {
      const testPrompt = PromptService.buildTestPrompt();

      const response = await this.ollama.generate({
        model: modelId,
        prompt: testPrompt,
        options: {
          temperature: 0.1,
          num_predict: 50,
        },
        stream: false,
      });

      const responseTime = Math.max(1, Date.now() - startTime); // Ensure at least 1ms
      const expectedResponse = 'Hello, I am working correctly.';
      const qualityScore = this.calculateQualityScore(
        response.response,
        expectedResponse
      );

      return {
        success: true,
        responseTime,
        qualityScore,
        sampleOutput: response.response,
      };
    } catch (error) {
      return {
        success: false,
        responseTime: Math.max(1, Date.now() - startTime), // Ensure at least 1ms
        error: error.message,
      };
    }
  }

  async getServiceStatus(): Promise<ServiceStatus> {
    try {
      const response = await this.ollama.list();

      return {
        isRunning: true,
        version: 'Unknown', // Ollama doesn't provide version info in list endpoint
        availableModels: response.models.length,
        memoryUsage: await this.getMemoryUsage(),
        lastHealthCheck: new Date(),
        warnings: [],
      };
    } catch (error) {
      return {
        isRunning: false,
        version: 'Unknown',
        availableModels: 0,
        lastHealthCheck: new Date(),
        warnings: [`Service connection failed: ${error.message}`],
      };
    }
  }

  async cancelGeneration(operationId: string): Promise<void> {
    const controller = this.activeOperations.get(operationId);
    if (controller) {
      controller.abort();
      this.activeOperations.delete(operationId);
    }
  }

  // Private helper methods

  private generateOperationId(): string {
    return `ollama_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private buildSummaryPrompt(content: string, options: SummaryOptions): string {
    return PromptService.buildSummaryPrompt(content, options);
  }

  private estimateParameterCount(modelName: string): string {
    // Basic parameter estimation based on common model names
    const name = modelName.toLowerCase();
    if (name.includes('7b')) return '7B';
    if (name.includes('13b')) return '13B';
    if (name.includes('30b')) return '30B';
    if (name.includes('70b')) return '70B';
    if (name.includes('3b')) return '3B';
    if (name.includes('1b')) return '1B';
    return 'Unknown';
  }

  private getModelCapabilities(modelName: string): ModelCapability[] {
    // Default capabilities for most models
    const capabilities: ModelCapability[] = [
      'text_analysis',
      'structured_output',
    ];

    const name = modelName.toLowerCase();
    if (name.includes('code') || name.includes('coder')) {
      capabilities.push('code_understanding');
    }
    if (name.includes('creative') || name.includes('writer')) {
      capabilities.push('creative_writing');
    }
    if (name.includes('long') || name.includes('context')) {
      capabilities.push('long_context');
    }

    return capabilities;
  }

  private getModelPerformance(modelName: string): ModelPerformance {
    // Estimated performance based on model size
    const paramCount = this.estimateParameterCount(modelName);

    switch (paramCount) {
      case '1B':
      case '3B':
        return {
          averageResponseTime: 2000,
          qualityRating: 3,
          memoryEfficiency: 5,
          speedRating: 5,
        };
      case '7B':
        return {
          averageResponseTime: 5000,
          qualityRating: 4,
          memoryEfficiency: 4,
          speedRating: 4,
        };
      case '13B':
        return {
          averageResponseTime: 8000,
          qualityRating: 4,
          memoryEfficiency: 3,
          speedRating: 3,
        };
      case '30B':
      case '70B':
        return {
          averageResponseTime: 15000,
          qualityRating: 5,
          memoryEfficiency: 2,
          speedRating: 2,
        };
      default:
        return {
          averageResponseTime: 5000,
          qualityRating: 3,
          memoryEfficiency: 3,
          speedRating: 3,
        };
    }
  }

  private getModelRequirements(modelName: string): ModelRequirements {
    const paramCount = this.estimateParameterCount(modelName);

    switch (paramCount) {
      case '1B':
        return {
          minMemoryGB: 2,
          recommendedMemoryGB: 4,
          diskSpaceGB: 1,
          supportsGPU: true,
          minCPUCores: 2,
        };
      case '3B':
        return {
          minMemoryGB: 4,
          recommendedMemoryGB: 8,
          diskSpaceGB: 2,
          supportsGPU: true,
          minCPUCores: 4,
        };
      case '7B':
        return {
          minMemoryGB: 8,
          recommendedMemoryGB: 16,
          diskSpaceGB: 4,
          supportsGPU: true,
          minCPUCores: 4,
        };
      case '13B':
        return {
          minMemoryGB: 16,
          recommendedMemoryGB: 32,
          diskSpaceGB: 8,
          supportsGPU: true,
          minCPUCores: 8,
        };
      case '30B':
        return {
          minMemoryGB: 32,
          recommendedMemoryGB: 64,
          diskSpaceGB: 16,
          supportsGPU: true,
          minCPUCores: 8,
        };
      case '70B':
        return {
          minMemoryGB: 64,
          recommendedMemoryGB: 128,
          diskSpaceGB: 32,
          supportsGPU: true,
          minCPUCores: 16,
        };
      default:
        return {
          minMemoryGB: 8,
          recommendedMemoryGB: 16,
          diskSpaceGB: 4,
          supportsGPU: true,
          minCPUCores: 4,
        };
    }
  }

  private async getMemoryUsage(): Promise<MemoryUsage> {
    // This is a simplified implementation
    // In a real scenario, you might want to query system memory or Ollama-specific metrics
    const totalMemory = 16 * 1024 * 1024 * 1024; // 16GB as example
    const usedMemory = Math.floor(totalMemory * 0.3); // Assume 30% usage

    return {
      used: usedMemory,
      total: totalMemory,
      percentage: Math.round((usedMemory / totalMemory) * 100),
    };
  }

  private calculateQualityScore(actual: string, expected: string): number {
    // Simple quality scoring based on similarity
    const actualLower = actual.toLowerCase().trim();
    const expectedLower = expected.toLowerCase().trim();

    if (actualLower.includes(expectedLower)) {
      return 1.0;
    }

    // Calculate basic similarity
    const words = expectedLower.split(' ');
    const matchedWords = words.filter(word => actualLower.includes(word));

    return matchedWords.length / words.length;
  }
}
