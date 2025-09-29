/**
 * Unit tests for OllamaService
 * Requirements: 1.2, 1.3, 7.1, 7.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OllamaService } from '../ollama-service';
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

describe('OllamaService', () => {
  let service: OllamaService;
  let mockOllamaInstance: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock Ollama instance
    mockOllamaInstance = {
      list: mockList,
      generate: mockGenerate,
    };
    
    // Create service instance with mocked Ollama
    service = new OllamaService('http://localhost:11434', mockOllamaInstance);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isAvailable', () => {
    it('should return true when service is running', async () => {
      mockList.mockResolvedValue({ models: [] });
      
      const result = await service.isAvailable();
      
      expect(result).toBe(true);
      expect(mockList).toHaveBeenCalled();
    });

    it('should return false when service is not running', async () => {
      mockList.mockRejectedValue(new Error('Connection failed'));
      
      const result = await service.isAvailable();
      
      expect(result).toBe(false);
    });
  });

  describe('listAvailableModels', () => {
    it('should return formatted model list', async () => {
      const mockModels = [
        {
          name: 'llama2:7b',
          digest: 'sha256:abcd1234567890',
          size: 3825819519
        },
        {
          name: 'mistral:latest',
          digest: 'sha256:efgh0987654321',
          size: 4109016832
        }
      ];

      mockList.mockResolvedValue({ models: mockModels });
      
      const result = await service.listAvailableModels();
      
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'llama2:7b',
        name: 'llama2:7b',
        description: 'Ollama model: llama2:7b',
        version: 'sha256:abcd1',
        parameterCount: '7B',
        isAvailable: true,
        isDownloaded: true
      });
      
      expect(result[0].capabilities).toContain('text_analysis');
      expect(result[0].capabilities).toContain('structured_output');
      expect(result[0].performance).toHaveProperty('averageResponseTime');
      expect(result[0].requirements).toHaveProperty('minMemoryGB');
    });

    it('should return empty array when list fails', async () => {
      mockList.mockRejectedValue(new Error('Failed to connect'));
      
      const result = await service.listAvailableModels();
      
      expect(result).toEqual([]);
    });
  });

  describe('getCurrentModel', () => {
    it('should return null when no model is set', async () => {
      const result = await service.getCurrentModel();
      
      expect(result).toBeNull();
    });

    it('should return current model when set', async () => {
      const mockModels = [{
        name: 'llama2:7b',
        digest: 'sha256:abcd1234567890',
        size: 3825819519
      }];

      mockList.mockResolvedValue({ models: mockModels });
      
      await service.setActiveModel('llama2:7b');
      const result = await service.getCurrentModel();
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe('llama2:7b');
    });
  });

  describe('setActiveModel', () => {
    it('should set active model when model exists', async () => {
      const mockModels = [{
        name: 'llama2:7b',
        digest: 'sha256:abcd1234567890',
        size: 3825819519
      }];

      mockList.mockResolvedValue({ models: mockModels });
      
      await expect(service.setActiveModel('llama2:7b')).resolves.not.toThrow();
      
      const currentModel = await service.getCurrentModel();
      expect(currentModel?.id).toBe('llama2:7b');
    });

    it('should throw error when model does not exist', async () => {
      mockList.mockResolvedValue({ models: [] });
      
      await expect(service.setActiveModel('nonexistent:model'))
        .rejects.toThrow('Model nonexistent:model not found');
    });
  });

  describe('testModel', () => {
    it('should return successful test result', async () => {
      const mockResponse = {
        response: 'Hello, I am working correctly.'
      };

      mockGenerate.mockResolvedValue(mockResponse);
      
      const result = await service.testModel('llama2:7b');
      
      expect(result.success).toBe(true);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.qualityScore).toBe(1.0);
      expect(result.sampleOutput).toBe('Hello, I am working correctly.');
    });

    it('should return failed test result on error', async () => {
      mockGenerate.mockRejectedValue(new Error('Model not found'));
      
      const result = await service.testModel('nonexistent:model');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Model not found');
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should calculate quality score correctly', async () => {
      const mockResponse = {
        response: 'Hello, I am working.'
      };

      mockGenerate.mockResolvedValue(mockResponse);
      
      const result = await service.testModel('llama2:7b');
      
      expect(result.success).toBe(true);
      expect(result.qualityScore).toBeGreaterThan(0);
      expect(result.qualityScore).toBeLessThan(1);
    });
  });

  describe('getServiceStatus', () => {
    it('should return running status when service is available', async () => {
      const mockModels = [
        { name: 'model1', digest: 'abc', size: 123 },
        { name: 'model2', digest: 'def', size: 456 }
      ];

      mockList.mockResolvedValue({ models: mockModels });
      
      const result = await service.getServiceStatus();
      
      expect(result.isRunning).toBe(true);
      expect(result.availableModels).toBe(2);
      expect(result.memoryUsage).toBeDefined();
      expect(result.lastHealthCheck).toBeInstanceOf(Date);
      expect(result.warnings).toEqual([]);
    });

    it('should return not running status when service is unavailable', async () => {
      mockList.mockRejectedValue(new Error('Connection refused'));
      
      const result = await service.getServiceStatus();
      
      expect(result.isRunning).toBe(false);
      expect(result.availableModels).toBe(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Service connection failed');
    });
  });

  describe('generateSummary', () => {
    const mockSummaryOptions: SummaryOptions = {
      length: 'standard',
      focusAreas: ['plot', 'characters'],
      includeProductionNotes: true,
      analyzeCharacterRelationships: true,
      identifyThemes: true,
      assessMarketability: false
    };

    it('should throw error when service is not available', async () => {
      mockList.mockRejectedValue(new Error('Service unavailable'));
      
      await expect(service.generateSummary('test content', mockSummaryOptions))
        .rejects.toThrow('Ollama service is not available');
    });

    it('should throw error when no model is selected', async () => {
      mockList.mockResolvedValue({ models: [] });
      
      await expect(service.generateSummary('test content', mockSummaryOptions))
        .rejects.toThrow('No model selected. Please set an active model first.');
    });

    it('should generate summary when service and model are available', async () => {
      // Setup service availability
      mockList.mockResolvedValue({ 
        models: [{ name: 'llama2:7b', digest: 'abc', size: 123 }] 
      });
      
      // Setup model
      await service.setActiveModel('llama2:7b');
      
      // Setup generation response
      mockGenerate.mockResolvedValue({
        response: 'This is a test summary of the script content.'
      });
      
      const result = await service.generateSummary('test script content', mockSummaryOptions);
      
      expect(result).toBeDefined();
      expect(result.id).toMatch(/^summary_\d+_[a-z0-9]+$/);
      expect(result.scriptId).toMatch(/^script_\d+$/);
      expect(result.plotOverview).toContain('This is a test summary');
      expect(result.modelUsed).toBe('llama2:7b');
      expect(result.generationOptions).toEqual(mockSummaryOptions);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle generation errors', async () => {
      // Setup service availability
      mockList.mockResolvedValue({ 
        models: [{ name: 'llama2:7b', digest: 'abc', size: 123 }] 
      });
      
      // Setup model
      await service.setActiveModel('llama2:7b');
      
      // Setup generation error
      mockGenerate.mockRejectedValue(new Error('Generation failed'));
      
      await expect(service.generateSummary('test content', mockSummaryOptions))
        .rejects.toThrow('Failed to generate summary: Generation failed');
    });
  });

  describe('cancelGeneration', () => {
    it('should not throw error for non-existent operation', async () => {
      await expect(service.cancelGeneration('nonexistent-id'))
        .resolves.not.toThrow();
    });
  });

  describe('parameter estimation', () => {
    it('should estimate parameters correctly from model names', async () => {
      const testCases = [
        { name: 'llama2:7b', expected: '7B' },
        { name: 'mistral:13b-instruct', expected: '13B' },
        { name: 'codellama:70b', expected: '70B' },
        { name: 'phi:3b', expected: '3B' },
        { name: 'tinyllama:1b', expected: '1B' },
        { name: 'custom-model', expected: 'Unknown' }
      ];

      for (const testCase of testCases) {
        mockList.mockResolvedValue({ 
          models: [{ name: testCase.name, digest: 'abc', size: 123 }] 
        });
        
        const models = await service.listAvailableModels();
        expect(models[0].parameterCount).toBe(testCase.expected);
      }
    });
  });

  describe('model capabilities detection', () => {
    it('should detect code capabilities', async () => {
      mockList.mockResolvedValue({ 
        models: [{ name: 'codellama:7b', digest: 'abc', size: 123 }] 
      });
      
      const models = await service.listAvailableModels();
      expect(models[0].capabilities).toContain('code_understanding');
    });

    it('should have default capabilities', async () => {
      mockList.mockResolvedValue({ 
        models: [{ name: 'llama2:7b', digest: 'abc', size: 123 }] 
      });
      
      const models = await service.listAvailableModels();
      expect(models[0].capabilities).toContain('text_analysis');
      expect(models[0].capabilities).toContain('structured_output');
    });
  });
});