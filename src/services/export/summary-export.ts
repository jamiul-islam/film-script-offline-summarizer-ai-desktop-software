import type { ScriptSummary } from '../../types/summary';

export interface ExportOptions {
  format: 'pdf' | 'txt';
  includeMetadata?: boolean;
  includeProductionNotes?: boolean;
  includeCharacterDetails?: boolean;
}

export interface ExportProgress {
  stage: 'preparing' | 'formatting' | 'generating' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}

export class SummaryExportService {
  /**
   * Export a single summary to the specified format
   */
  async exportSummary(
    summary: ScriptSummary,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<string> {
    try {
      onProgress?.({
        stage: 'preparing',
        progress: 0,
        message: 'Preparing export...',
      });

      const content = this.formatSummaryContent(summary, options);

      onProgress?.({
        stage: 'formatting',
        progress: 30,
        message: 'Formatting content...',
      });

      let result: string;

      if (options.format === 'pdf') {
        result = await this.generatePDF(content, summary, onProgress);
      } else {
        result = await this.generateText(content, summary, onProgress);
      }

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Export completed successfully',
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Export multiple summaries in batch
   */
  async exportBatch(
    summaries: ScriptSummary[],
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<string[]> {
    const results: string[] = [];
    const total = summaries.length;

    for (let i = 0; i < summaries.length; i++) {
      const summary = summaries[i];
      const overallProgress = Math.floor((i / total) * 100);

      onProgress?.({
        stage: 'generating',
        progress: overallProgress,
        message: `Exporting summary ${i + 1} of ${total}...`,
      });

      try {
        const result = await this.exportSummary(summary, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to export summary ${summary.id}:`, error);
        // Continue with other summaries even if one fails
        results.push('');
      }
    }

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: `Batch export completed (${results.filter(r => r).length}/${total} successful)`,
    });

    return results;
  }

  /**
   * Format summary content for export
   */
  private formatSummaryContent(
    summary: ScriptSummary,
    options: ExportOptions
  ): string {
    const sections: string[] = [];

    // Header
    sections.push('SCRIPT SUMMARY');
    sections.push('='.repeat(50));
    sections.push('');

    // Metadata
    if (options.includeMetadata !== false) {
      sections.push('METADATA');
      sections.push('-'.repeat(20));
      sections.push(`Generated: ${summary.createdAt.toLocaleDateString()}`);
      sections.push(`Model: ${summary.modelUsed}`);
      if (summary.genre) sections.push(`Genre: ${summary.genre}`);
      if (summary.estimatedBudget)
        sections.push(`Budget: ${summary.estimatedBudget}`);
      if (summary.targetAudience)
        sections.push(`Target Audience: ${summary.targetAudience}`);
      sections.push('');
    }

    // Plot Overview
    sections.push('PLOT OVERVIEW');
    sections.push('-'.repeat(20));
    sections.push(summary.plotOverview);
    sections.push('');

    if (summary.toneAndStyle) {
      sections.push('TONE & STYLE');
      sections.push('-'.repeat(20));
      sections.push(summary.toneAndStyle);
      sections.push('');
    }

    if (summary.keyScenes && summary.keyScenes.length > 0) {
      sections.push('KEY SCENES');
      sections.push('-'.repeat(20));
      summary.keyScenes.forEach((scene, index) => {
        sections.push(`${index + 1}. ${scene}`);
      });
      sections.push('');
    }

    // Characters
    if (
      options.includeCharacterDetails !== false &&
      summary.mainCharacters.length > 0
    ) {
      sections.push('CHARACTERS');
      sections.push('-'.repeat(20));
      summary.mainCharacters.forEach(character => {
        sections.push(`${character.name} (${character.importance})`);
        sections.push(`  ${character.description}`);

        if (character.characterArc) {
          sections.push(`  Arc: ${character.characterArc}`);
        }

        if (character.traits && character.traits.length > 0) {
          sections.push(`  Traits: ${character.traits.join(', ')}`);
        }

        if (character.relationships.length > 0) {
          sections.push(
            `  Relationships: ${character.relationships.join('; ')}`
          );
        }

        if (character.ageRange) {
          sections.push(`  Age: ${character.ageRange}`);
        }

        sections.push('');
      });
    }

    // Themes
    if (summary.themes.length > 0) {
      sections.push('THEMES');
      sections.push('-'.repeat(20));
      summary.themes.forEach((theme, index) => {
        sections.push(`${index + 1}. ${theme}`);
      });
      sections.push('');
    }

    // Production Notes
    if (
      options.includeProductionNotes !== false &&
      summary.productionNotes.length > 0
    ) {
      sections.push('PRODUCTION NOTES');
      sections.push('-'.repeat(20));

      // Group by priority
      const groupedNotes = summary.productionNotes.reduce(
        (acc, note) => {
          if (!acc[note.priority]) acc[note.priority] = [];
          acc[note.priority].push(note);
          return acc;
        },
        {} as Record<string, typeof summary.productionNotes>
      );

      (['critical', 'high', 'medium', 'low'] as const).forEach(priority => {
        const notes = groupedNotes[priority];
        if (notes && notes.length > 0) {
          sections.push(`${priority.toUpperCase()} PRIORITY:`);
          notes.forEach(note => {
            sections.push(
              `  • ${note.category.toUpperCase()}: ${note.content}`
            );
            if (note.budgetImpact) {
              sections.push(`    Budget Impact: ${note.budgetImpact}`);
            }
            if (note.requirements && note.requirements.length > 0) {
              sections.push(
                `    Requirements: ${note.requirements.join(', ')}`
              );
            }
          });
          sections.push('');
        }
      });

      if (
        summary.productionChallenges &&
        summary.productionChallenges.length > 0
      ) {
        sections.push('PRODUCTION CHALLENGES:');
        summary.productionChallenges.forEach((challenge, index) => {
          sections.push(`${index + 1}. ${challenge}`);
        });
        sections.push('');
      }
    }

    // Market Analysis
    if (summary.marketability) {
      sections.push('MARKET ANALYSIS');
      sections.push('-'.repeat(20));
      sections.push(summary.marketability);
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate text export
   */
  private async generateText(
    content: string,
    summary: ScriptSummary,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<string> {
    onProgress?.({
      stage: 'generating',
      progress: 70,
      message: 'Generating text file...',
    });

    // For text export, we can return the content directly
    // In a real implementation, this might save to a file and return the path
    return content;
  }

  /**
   * Generate PDF export
   */
  private async generatePDF(
    content: string,
    summary: ScriptSummary,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<string> {
    onProgress?.({
      stage: 'generating',
      progress: 70,
      message: 'Generating PDF...',
    });

    // For now, return the text content
    // In a real implementation, this would use a PDF library like jsPDF or Puppeteer
    // to generate an actual PDF file and return the file path or base64 data

    // Simulate PDF generation delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return `PDF Export of ${summary.scriptId}\n\n${content}`;
  }

  /**
   * Get suggested filename for export
   */
  getSuggestedFilename(summary: ScriptSummary, format: 'pdf' | 'txt'): string {
    // Get script title from summary or use script ID
    const baseTitle = summary.scriptId.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    return `${baseTitle}_summary_${timestamp}.${format}`;
  }

  /**
   * Validate export options
   */
  validateExportOptions(options: ExportOptions): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!options.format || !['pdf', 'txt'].includes(options.format)) {
      errors.push('Invalid format. Must be "pdf" or "txt"');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
