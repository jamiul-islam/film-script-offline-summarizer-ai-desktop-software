import { useState, useCallback } from 'react';
import { SummaryExportService, ExportOptions, ExportProgress } from '../services/export';
import type { ScriptSummary } from '../types/summary';

interface UseExportState {
  isExporting: boolean;
  progress: ExportProgress | null;
  error: string | null;
}

interface UseExportReturn extends UseExportState {
  exportSummary: (summary: ScriptSummary, options: ExportOptions) => Promise<string | null>;
  exportBatch: (summaries: ScriptSummary[], options: ExportOptions) => Promise<string[] | null>;
  clearError: () => void;
  reset: () => void;
}

export const useExport = (): UseExportReturn => {
  const [state, setState] = useState<UseExportState>({
    isExporting: false,
    progress: null,
    error: null,
  });

  const exportService = new SummaryExportService();

  const updateProgress = useCallback((progress: ExportProgress) => {
    setState(prev => ({
      ...prev,
      progress,
      error: progress.error || null,
    }));
  }, []);

  const exportSummary = useCallback(async (
    summary: ScriptSummary,
    options: ExportOptions
  ): Promise<string | null> => {
    try {
      setState(prev => ({
        ...prev,
        isExporting: true,
        error: null,
        progress: null,
      }));

      // Validate options
      const validation = exportService.validateExportOptions(options);
      if (!validation.valid) {
        throw new Error(`Invalid export options: ${validation.errors.join(', ')}`);
      }

      const result = await exportService.exportSummary(summary, options, updateProgress);
      
      setState(prev => ({
        ...prev,
        isExporting: false,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setState(prev => ({
        ...prev,
        isExporting: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [exportService, updateProgress]);

  const exportBatch = useCallback(async (
    summaries: ScriptSummary[],
    options: ExportOptions
  ): Promise<string[] | null> => {
    try {
      setState(prev => ({
        ...prev,
        isExporting: true,
        error: null,
        progress: null,
      }));

      // Validate options
      const validation = exportService.validateExportOptions(options);
      if (!validation.valid) {
        throw new Error(`Invalid export options: ${validation.errors.join(', ')}`);
      }

      if (summaries.length === 0) {
        throw new Error('No summaries provided for batch export');
      }

      const results = await exportService.exportBatch(summaries, options, updateProgress);
      
      setState(prev => ({
        ...prev,
        isExporting: false,
      }));

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch export failed';
      setState(prev => ({
        ...prev,
        isExporting: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [exportService, updateProgress]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isExporting: false,
      progress: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    exportSummary,
    exportBatch,
    clearError,
    reset,
  };
};