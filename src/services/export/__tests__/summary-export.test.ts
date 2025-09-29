import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SummaryExportService } from '../summary-export';
import type { ScriptSummary, ExportOptions, ExportProgress } from '../../../types';

const mockSummary: ScriptSummary = {
  id: 'test-summary-1',
  scriptId: 'test-script-1',
  plotOverview: 'A compelling story about a young hero who discovers their destiny.',
  mainCharacters: [
    {
      name: 'Alex Thompson',
      description: 'The protagonist, a 25-year-old reluctant hero',
      importance: 'protagonist',
      relationships: ['Mentor to Sarah'],
      characterArc: 'Transforms from reluctant to confident leader',
      ageRange: '25-30',
      traits: ['brave', 'stubborn'],
    },
  ],
  themes: ['Good vs Evil', 'Coming of Age'],
  productionNotes: [
    {
      category: 'budget',
      content: 'Requires significant VFX budget',
      priority: 'high',
      budgetImpact: 'significant',
      requirements: ['VFX team'],
    },
  ],
  genre: 'Fantasy Adventure',
  estimatedBudget: 'high',
  targetAudience: 'Young adults aged 16-35',
  toneAndStyle: 'Epic and adventurous',
  keyScenes: ['Opening sequence', 'Final confrontation'],
  productionChallenges: ['Weather-dependent shooting'],
  marketability: 'Strong franchise potential',
  modelUsed: 'llama3.1:8b',
  generationOptions: {
    model: 'llama3.1:8b',
    summaryLength: 'detailed',
    focusAreas: ['plot', 'characters'],
    includeProductionNotes: true,
    includeCharacterAnalysis: true,
    includeThemeAnalysis: true,
  },
  createdAt: new Date('2024-01-15T10:30:00Z'),
  updatedAt: new Date('2024-01-15T10:30:00Z'),
};

describe('SummaryExportService', () => {
  let exportService: SummaryExportService;
  let mockProgressCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    exportService = new SummaryExportService();
    mockProgressCallback = vi.fn();
  });

  describe('exportSummary', () => {
    it('exports summary as text format', async () => {
      const options: ExportOptions = {
        format: 'txt',
        includeMetadata: true,
        includeProductionNotes: true,
        includeCharacterDetails: true,
      };

      const result = await exportService.exportSummary(mockSummary, options, mockProgressCallback);

      expect(result).toContain('SCRIPT SUMMARY');
      expect(result).toContain('A compelling story about a young hero');
      expect(result).toContain('Alex Thompson');
      expect(result).toContain('Good vs Evil');
      expect(result).toContain('Requires significant VFX budget');
      expect(result).toContain('Strong franchise potential');
    });

    it('exports summary as PDF format', async () => {
      const options: ExportOptions = {
        format: 'pdf',
        includeMetadata: true,
        includeProductionNotes: true,
        includeCharacterDetails: true,
      };

      const result = await exportService.exportSummary(mockSummary, options, mockProgressCallback);

      expect(result).toContain('PDF Export of test-script-1');
      expect(result).toContain('SCRIPT SUMMARY');
    });

    it('calls progress callback with correct stages', async () => {
      const options: ExportOptions = { format: 'txt' };

      await exportService.exportSummary(mockSummary, options, mockProgressCallback);

      expect(mockProgressCallback).toHaveBeenCalledWith({
        stage: 'preparing',
        progress: 0,
        message: 'Preparing export...'
      });

      expect(mockProgressCallback).toHaveBeenCalledWith({
        stage: 'formatting',
        progress: 30,
        message: 'Formatting content...'
      });

      expect(mockProgressCallback).toHaveBeenCalledWith({
        stage: 'complete',
        progress: 100,
        message: 'Export completed successfully'
      });
    });

    it('handles export errors correctly', async () => {
      const options: ExportOptions = { format: 'txt' };
      
      // Mock an error in the export process
      vi.spyOn(exportService as any, 'formatSummaryContent').mockImplementation(() => {
        throw new Error('Formatting failed');
      });

      await expect(exportService.exportSummary(mockSummary, options, mockProgressCallback))
        .rejects.toThrow('Formatting failed');

      expect(mockProgressCallback).toHaveBeenCalledWith({
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        error: 'Formatting failed'
      });
    });

    it('excludes optional sections when configured', async () => {
      const options: ExportOptions = {
        format: 'txt',
        includeMetadata: false,
        includeProductionNotes: false,
        includeCharacterDetails: false,
      };

      const result = await exportService.exportSummary(mockSummary, options);

      expect(result).not.toContain('METADATA');
      expect(result).not.toContain('Alex Thompson (protagonist)');
      expect(result).not.toContain('PRODUCTION NOTES');
      expect(result).toContain('PLOT OVERVIEW'); // Should always be included
      expect(result).toContain('THEMES'); // Should always be included
    });
  });

  describe('exportBatch', () => {
    it('exports multiple summaries', async () => {
      const summaries = [mockSummary, { ...mockSummary, id: 'test-summary-2', scriptId: 'test-script-2' }];
      const options: ExportOptions = { format: 'txt' };

      const results = await exportService.exportBatch(summaries, options, mockProgressCallback);

      expect(results).toHaveLength(2);
      expect(results[0]).toContain('SCRIPT SUMMARY');
      expect(results[1]).toContain('SCRIPT SUMMARY');
    });

    it('continues batch export even if one summary fails', async () => {
      const summaries = [mockSummary, { ...mockSummary, id: 'test-summary-2' }];
      const options: ExportOptions = { format: 'txt' };

      // Mock failure for the second summary
      vi.spyOn(exportService, 'exportSummary')
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('Export failed'));

      const results = await exportService.exportBatch(summaries, options, mockProgressCallback);

      expect(results).toHaveLength(2);
      expect(results[0]).toBe('success');
      expect(results[1]).toBe(''); // Empty string for failed export
    });

    it('reports batch progress correctly', async () => {
      const summaries = [mockSummary, { ...mockSummary, id: 'test-summary-2' }];
      const options: ExportOptions = { format: 'txt' };

      await exportService.exportBatch(summaries, options, mockProgressCallback);

      expect(mockProgressCallback).toHaveBeenCalledWith({
        stage: 'generating',
        progress: 0,
        message: 'Exporting summary 1 of 2...'
      });

      expect(mockProgressCallback).toHaveBeenCalledWith({
        stage: 'generating',
        progress: 50,
        message: 'Exporting summary 2 of 2...'
      });

      expect(mockProgressCallback).toHaveBeenCalledWith({
        stage: 'complete',
        progress: 100,
        message: 'Batch export completed (2/2 successful)'
      });
    });
  });

  describe('formatSummaryContent', () => {
    it('formats content with all sections', () => {
      const options: ExportOptions = {
        format: 'txt',
        includeMetadata: true,
        includeProductionNotes: true,
        includeCharacterDetails: true,
      };

      const content = (exportService as any).formatSummaryContent(mockSummary, options);

      expect(content).toContain('SCRIPT SUMMARY');
      expect(content).toContain('METADATA');
      expect(content).toContain('PLOT OVERVIEW');
      expect(content).toContain('TONE & STYLE');
      expect(content).toContain('KEY SCENES');
      expect(content).toContain('CHARACTERS');
      expect(content).toContain('THEMES');
      expect(content).toContain('PRODUCTION NOTES');
      expect(content).toContain('MARKET ANALYSIS');
    });

    it('formats character details correctly', () => {
      const options: ExportOptions = {
        format: 'txt',
        includeCharacterDetails: true,
      };

      const content = (exportService as any).formatSummaryContent(mockSummary, options);

      expect(content).toContain('Alex Thompson (protagonist)');
      expect(content).toContain('The protagonist, a 25-year-old reluctant hero');
      expect(content).toContain('Arc: Transforms from reluctant to confident leader');
      expect(content).toContain('Traits: brave, stubborn');
      expect(content).toContain('Relationships: Mentor to Sarah');
      expect(content).toContain('Age: 25-30');
    });

    it('formats production notes by priority', () => {
      const options: ExportOptions = {
        format: 'txt',
        includeProductionNotes: true,
      };

      const content = (exportService as any).formatSummaryContent(mockSummary, options);

      expect(content).toContain('HIGH PRIORITY:');
      expect(content).toContain('• BUDGET: Requires significant VFX budget');
      expect(content).toContain('Budget Impact: significant');
      expect(content).toContain('Requirements: VFX team');
      expect(content).toContain('PRODUCTION CHALLENGES:');
      expect(content).toContain('1. Weather-dependent shooting');
    });
  });

  describe('getSuggestedFilename', () => {
    it('generates correct filename for text export', () => {
      const filename = exportService.getSuggestedFilename(mockSummary, 'txt');
      
      expect(filename).toMatch(/^test_script_1_summary_\d{4}-\d{2}-\d{2}\.txt$/);
    });

    it('generates correct filename for PDF export', () => {
      const filename = exportService.getSuggestedFilename(mockSummary, 'pdf');
      
      expect(filename).toMatch(/^test_script_1_summary_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('sanitizes script ID for filename', () => {
      const summaryWithSpecialChars = {
        ...mockSummary,
        scriptId: 'test-script@#$%^&*()_+{}|:"<>?[]\\;\',./',
      };
      
      const filename = exportService.getSuggestedFilename(summaryWithSpecialChars, 'txt');
      
      expect(filename).toMatch(/^test_script_+_summary_\d{4}-\d{2}-\d{2}\.txt$/);
    });
  });

  describe('validateExportOptions', () => {
    it('validates correct options', () => {
      const options: ExportOptions = { format: 'txt' };
      
      const result = exportService.validateExportOptions(options);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid format', () => {
      const options = { format: 'invalid' } as any;
      
      const result = exportService.validateExportOptions(options);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid format. Must be "pdf" or "txt"');
    });

    it('rejects missing format', () => {
      const options = {} as any;
      
      const result = exportService.validateExportOptions(options);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid format. Must be "pdf" or "txt"');
    });
  });
});