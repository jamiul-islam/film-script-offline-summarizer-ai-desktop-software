import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExport } from '../useExport';
import { SummaryExportService } from '../../services/export/summary-export';
import type { ScriptSummary } from '../../types';

// Mock the export service
vi.mock('../../services/export/summary-export');

const mockSummary: ScriptSummary = {
  id: 'test-summary-1',
  scriptId: 'test-script-1',
  plotOverview: 'A compelling story about a young hero.',
  mainCharacters: [],
  themes: ['Good vs Evil'],
  productionNotes: [],
  genre: 'Fantasy',
  modelUsed: 'test-model',
  generationOptions: {
    model: 'test-model',
    summaryLength: 'brief',
    focusAreas: ['plot'],
    includeProductionNotes: false,
    includeCharacterAnalysis: false,
    includeThemeAnalysis: false,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('useExport', () => {
  let mockExportService: any;

  beforeEach(() => {
    mockExportService = {
      exportSummary: vi.fn(),
      exportBatch: vi.fn(),
      validateExportOptions: vi.fn(),
    };

    (SummaryExportService as any).mockImplementation(() => mockExportService);
  });

  describe('initial state', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useExport());

      expect(result.current.isExporting).toBe(false);
      expect(result.current.progress).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  describe('exportSummary', () => {
    it('successfully exports a summary', async () => {
      mockExportService.validateExportOptions.mockReturnValue({
        valid: true,
        errors: [],
      });
      mockExportService.exportSummary.mockResolvedValue('export result');

      const { result } = renderHook(() => useExport());

      let exportResult: string | null = null;
      await act(async () => {
        exportResult = await result.current.exportSummary(mockSummary, {
          format: 'txt',
        });
      });

      expect(exportResult).toBe('export result');
      expect(result.current.isExporting).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('handles export errors', async () => {
      mockExportService.validateExportOptions.mockReturnValue({
        valid: true,
        errors: [],
      });
      mockExportService.exportSummary.mockRejectedValue(
        new Error('Export failed')
      );

      const { result } = renderHook(() => useExport());

      let exportResult: string | null = null;
      await act(async () => {
        exportResult = await result.current.exportSummary(mockSummary, {
          format: 'txt',
        });
      });

      expect(exportResult).toBe(null);
      expect(result.current.isExporting).toBe(false);
      expect(result.current.error).toBe('Export failed');
    });

    it('handles validation errors', async () => {
      mockExportService.validateExportOptions.mockReturnValue({
        valid: false,
        errors: ['Invalid format'],
      });

      const { result } = renderHook(() => useExport());

      let exportResult: string | null = null;
      await act(async () => {
        exportResult = await result.current.exportSummary(mockSummary, {
          format: 'invalid' as any,
        });
      });

      expect(exportResult).toBe(null);
      expect(result.current.error).toContain('Invalid export options');
    });

    it('updates progress during export', async () => {
      mockExportService.validateExportOptions.mockReturnValue({
        valid: true,
        errors: [],
      });
      mockExportService.exportSummary.mockImplementation(
        async (summary, options, onProgress) => {
          onProgress?.({
            stage: 'preparing',
            progress: 0,
            message: 'Preparing...',
          });

          onProgress?.({
            stage: 'generating',
            progress: 50,
            message: 'Generating...',
          });

          return 'result';
        }
      );

      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.exportSummary(mockSummary, { format: 'txt' });
      });

      // Progress should be updated during the export
      expect(mockExportService.exportSummary).toHaveBeenCalledWith(
        mockSummary,
        { format: 'txt' },
        expect.any(Function)
      );
    });

    it('sets isExporting to true during export', async () => {
      mockExportService.validateExportOptions.mockReturnValue({
        valid: true,
        errors: [],
      });

      let resolveExport: (value: string) => void;
      const exportPromise = new Promise<string>(resolve => {
        resolveExport = resolve;
      });
      mockExportService.exportSummary.mockReturnValue(exportPromise);

      const { result } = renderHook(() => useExport());

      // Start export
      act(() => {
        result.current.exportSummary(mockSummary, { format: 'txt' });
      });

      expect(result.current.isExporting).toBe(true);

      // Complete export
      await act(async () => {
        resolveExport!('result');
        await exportPromise;
      });

      expect(result.current.isExporting).toBe(false);
    });
  });

  describe('exportBatch', () => {
    it('successfully exports multiple summaries', async () => {
      const summaries = [mockSummary, { ...mockSummary, id: 'test-2' }];
      mockExportService.validateExportOptions.mockReturnValue({
        valid: true,
        errors: [],
      });
      mockExportService.exportBatch.mockResolvedValue(['result1', 'result2']);

      const { result } = renderHook(() => useExport());

      let exportResult: string[] | null = null;
      await act(async () => {
        exportResult = await result.current.exportBatch(summaries, {
          format: 'txt',
        });
      });

      expect(exportResult).toEqual(['result1', 'result2']);
      expect(result.current.isExporting).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('handles empty summaries array', async () => {
      mockExportService.validateExportOptions.mockReturnValue({
        valid: true,
        errors: [],
      });

      const { result } = renderHook(() => useExport());

      let exportResult: string[] | null = null;
      await act(async () => {
        exportResult = await result.current.exportBatch([], { format: 'txt' });
      });

      expect(exportResult).toBe(null);
      expect(result.current.error).toBe(
        'No summaries provided for batch export'
      );
    });

    it('handles batch export errors', async () => {
      const summaries = [mockSummary];
      mockExportService.validateExportOptions.mockReturnValue({
        valid: true,
        errors: [],
      });
      mockExportService.exportBatch.mockRejectedValue(
        new Error('Batch export failed')
      );

      const { result } = renderHook(() => useExport());

      let exportResult: string[] | null = null;
      await act(async () => {
        exportResult = await result.current.exportBatch(summaries, {
          format: 'txt',
        });
      });

      expect(exportResult).toBe(null);
      expect(result.current.error).toBe('Batch export failed');
    });
  });

  describe('utility functions', () => {
    it('clears error after failed export', async () => {
      mockExportService.validateExportOptions.mockReturnValue({
        valid: true,
        errors: [],
      });
      mockExportService.exportSummary.mockRejectedValue(
        new Error('Export failed')
      );

      const { result } = renderHook(() => useExport());

      // Trigger an error first
      await act(async () => {
        await result.current.exportSummary(mockSummary, { format: 'txt' });
      });

      expect(result.current.error).toBe('Export failed');

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    it('resets state after export', async () => {
      mockExportService.validateExportOptions.mockReturnValue({
        valid: true,
        errors: [],
      });
      mockExportService.exportSummary.mockRejectedValue(
        new Error('Export failed')
      );

      const { result } = renderHook(() => useExport());

      // Trigger an error to set some state
      await act(async () => {
        await result.current.exportSummary(mockSummary, { format: 'txt' });
      });

      expect(result.current.error).toBe('Export failed');

      // Reset the state
      act(() => {
        result.current.reset();
      });

      expect(result.current.isExporting).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.progress).toBe(null);
    });
  });
});
