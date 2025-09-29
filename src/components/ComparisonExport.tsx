import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { ScriptWithSummary, ScriptEvaluation } from '../types';

interface ComparisonExportProps {
  scripts: ScriptWithSummary[];
  evaluations?: Record<string, ScriptEvaluation>;
  onExport?: (format: 'pdf' | 'txt' | 'json', data: ComparisonReport) => void;
  className?: string;
}

interface ComparisonReport {
  title: string;
  generatedAt: Date;
  scripts: ScriptComparisonData[];
  summary: ComparisonSummary;
}

interface ScriptComparisonData {
  script: ScriptWithSummary;
  evaluation?: ScriptEvaluation;
  metrics: {
    wordCount: number;
    characterCount: number;
    themeCount: number;
    productionComplexity: 'low' | 'medium' | 'high';
  };
}

interface ComparisonSummary {
  totalScripts: number;
  averageRating: number;
  commonThemes: string[];
  genreDistribution: Record<string, number>;
  recommendations: string[];
}

export const ComparisonExport: React.FC<ComparisonExportProps> = ({
  scripts,
  evaluations = {},
  onExport,
  className = '',
}) => {
  const { animationsEnabled } = useTheme();
  const [exportFormat, setExportFormat] = useState<'pdf' | 'txt' | 'json'>(
    'pdf'
  );
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeRatings, setIncludeRatings] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const generateComparisonReport = (): ComparisonReport => {
    const scriptData: ScriptComparisonData[] = scripts.map(script => {
      const evaluation = evaluations[script.id];
      const wordCount = script.content?.split(/\s+/).length || 0;
      const characterCount = script.summary?.mainCharacters?.length || 0;
      const themeCount = script.summary?.themes?.length || 0;

      // Determine production complexity based on various factors
      let productionComplexity: 'low' | 'medium' | 'high' = 'medium';
      const complexityFactors = [
        script.summary?.productionNotes?.some(
          note => note.category === 'technical' && note.priority === 'high'
        ),
        characterCount > 10,
        script.summary?.themes?.includes('action') ||
          script.summary?.themes?.includes('sci-fi'),
        script.summary?.productionNotes?.some(
          note =>
            note.category === 'location' && note.content.includes('multiple')
        ),
      ].filter(Boolean).length;

      if (complexityFactors >= 3) productionComplexity = 'high';
      else if (complexityFactors <= 1) productionComplexity = 'low';

      return {
        script,
        evaluation,
        metrics: {
          wordCount,
          characterCount,
          themeCount,
          productionComplexity,
        },
      };
    });

    // Calculate summary statistics
    const ratings = scriptData
      .map(data => data.evaluation?.rating)
      .filter((rating): rating is number => rating !== undefined);

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0;

    // Find common themes
    const allThemes = scriptData.flatMap(
      data => data.script.summary?.themes || []
    );
    const themeFrequency = allThemes.reduce(
      (acc, theme) => {
        acc[theme] = (acc[theme] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const commonThemes = Object.entries(themeFrequency)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .map(([theme]) => theme)
      .slice(0, 5);

    // Genre distribution
    const genreDistribution = scriptData.reduce(
      (acc, data) => {
        const genre = data.script.summary?.genre || 'Unknown';
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Generate recommendations
    const recommendations: string[] = [];

    if (averageRating >= 4) {
      recommendations.push('Strong portfolio with high-quality scripts');
    } else if (averageRating < 2.5) {
      recommendations.push(
        'Consider focusing on script development before production'
      );
    }

    if (commonThemes.length > 0) {
      recommendations.push(
        `Consider developing a themed collection around: ${commonThemes.slice(0, 2).join(', ')}`
      );
    }

    const highComplexityCount = scriptData.filter(
      data => data.metrics.productionComplexity === 'high'
    ).length;

    if (highComplexityCount > scriptData.length / 2) {
      recommendations.push(
        'Portfolio leans toward high-budget productions - consider budget implications'
      );
    }

    const summary: ComparisonSummary = {
      totalScripts: scripts.length,
      averageRating,
      commonThemes,
      genreDistribution,
      recommendations,
    };

    return {
      title: `Script Comparison Report - ${scripts.length} Scripts`,
      generatedAt: new Date(),
      scripts: scriptData,
      summary,
    };
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const report = generateComparisonReport();

      // Show native save dialog
      const result = await window.electronAPI.file.saveDialog({
        defaultPath: `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${exportFormat}`,
        filters: [
          {
            name: `${exportFormat.toUpperCase()} Files`,
            extensions: [exportFormat],
          },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return;
      }

      // Generate content based on format
      let content: string;
      switch (exportFormat) {
        case 'json':
          content = JSON.stringify(report, null, 2);
          break;
        case 'txt':
          content = generateTextReport(report);
          break;
        case 'pdf':
          // For now, generate as text. In a real app, you'd use a PDF library
          content = generateTextReport(report);
          break;
        default:
          content = JSON.stringify(report, null, 2);
      }

      // Write file using electron API
      await window.electronAPI.file.write(result.filePath, content);

      // Call the onExport callback if provided
      if (onExport) {
        await onExport(exportFormat, report);
      }

      // Show success message
      alert(`Report exported successfully to ${result.filePath}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert(
        `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const generateTextReport = (report: ComparisonReport): string => {
    let content = `${report.title}\n`;
    content += `Generated: ${report.generatedAt.toLocaleString()}\n\n`;

    content += `SUMMARY\n`;
    content += `=======\n`;
    content += `Total Scripts: ${report.summary.totalScripts}\n`;
    content += `Average Rating: ${report.summary.averageRating.toFixed(1)}/5\n`;
    content += `Common Themes: ${report.summary.commonThemes.join(', ') || 'None'}\n`;
    content += `Genres: ${Object.keys(report.summary.genreDistribution).join(', ')}\n\n`;

    content += `SCRIPTS\n`;
    content += `=======\n`;
    report.scripts.forEach((scriptData, index) => {
      content += `${index + 1}. ${scriptData.script.title}\n`;
      content += `   Genre: ${scriptData.script.summary?.genre || 'Unknown'}\n`;
      content += `   Word Count: ${scriptData.metrics.wordCount.toLocaleString()}\n`;
      content += `   Characters: ${scriptData.metrics.characterCount}\n`;
      content += `   Complexity: ${scriptData.metrics.productionComplexity}\n`;

      if (includeRatings && scriptData.evaluation?.rating) {
        content += `   Rating: ${scriptData.evaluation.rating}/5 stars\n`;
      }

      if (includeNotes && scriptData.evaluation?.notes) {
        content += `   Notes: ${scriptData.evaluation.notes}\n`;
      }

      if (includeTags && scriptData.evaluation?.tags?.length) {
        content += `   Tags: ${scriptData.evaluation.tags.join(', ')}\n`;
      }

      content += '\n';
    });

    if (report.summary.recommendations.length > 0) {
      content += `RECOMMENDATIONS\n`;
      content += `===============\n`;
      report.summary.recommendations.forEach((rec, index) => {
        content += `${index + 1}. ${rec}\n`;
      });
    }

    return content;
  };

  const report = generateComparisonReport();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-100">
            Export Comparison
          </h3>
          <p className="text-slate-400 mt-1">
            Generate a comprehensive comparison report for {scripts.length}{' '}
            scripts
          </p>
        </div>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <h4 className="text-lg font-semibold text-slate-100 flex items-center">
            <span className="mr-2">⚙️</span>
            Export Settings
          </h4>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Export Format
              </label>
              <div className="flex space-x-3">
                {(['pdf', 'txt', 'json'] as const).map(format => (
                  <Button
                    key={format}
                    variant={exportFormat === format ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setExportFormat(format)}
                  >
                    {format.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Include Options */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Include in Export
              </label>
              <div className="space-y-2">
                {[
                  {
                    key: 'ratings',
                    label: 'Ratings',
                    state: includeRatings,
                    setter: setIncludeRatings,
                  },
                  {
                    key: 'notes',
                    label: 'Notes',
                    state: includeNotes,
                    setter: setIncludeNotes,
                  },
                  {
                    key: 'tags',
                    label: 'Tags',
                    state: includeTags,
                    setter: setIncludeTags,
                  },
                  {
                    key: 'metrics',
                    label: 'Metrics',
                    state: includeMetrics,
                    setter: setIncludeMetrics,
                  },
                ].map(({ key, label, state, setter }) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={state}
                      onChange={e => setter(e.target.checked)}
                      className="w-4 h-4 text-primary-600 bg-slate-700 border-slate-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-slate-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      <Card>
        <CardHeader>
          <h4 className="text-lg font-semibold text-slate-100 flex items-center">
            <span className="mr-2">👁️</span>
            Report Preview
          </h4>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-800/30 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-400">
                  {report.summary.totalScripts}
                </div>
                <div className="text-sm text-slate-400">Scripts</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-warning-400">
                  {report.summary.averageRating.toFixed(1)}
                </div>
                <div className="text-sm text-slate-400">Avg Rating</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-success-400">
                  {report.summary.commonThemes.length}
                </div>
                <div className="text-sm text-slate-400">Common Themes</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-accent-400">
                  {Object.keys(report.summary.genreDistribution).length}
                </div>
                <div className="text-sm text-slate-400">Genres</div>
              </div>
            </div>

            {/* Script List Preview */}
            <div>
              <h5 className="font-medium text-slate-200 mb-2">
                Scripts in Report:
              </h5>
              <div className="space-y-2">
                {report.scripts.map((data, index) => (
                  <div
                    key={data.script.id}
                    className="flex items-center justify-between p-3 bg-slate-800/20 rounded"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-400">#{index + 1}</span>
                      <span className="font-medium text-slate-100">
                        {data.script.title}
                      </span>
                      <span className="text-sm text-slate-400">
                        ({data.script.summary?.genre || 'Unknown'})
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      {includeRatings && data.evaluation?.rating && (
                        <div className="flex items-center space-x-1">
                          <span className="text-warning-400">⭐</span>
                          <span className="text-slate-300">
                            {data.evaluation.rating}
                          </span>
                        </div>
                      )}
                      {includeMetrics && (
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            data.metrics.productionComplexity === 'high'
                              ? 'bg-error-600/20 text-error-300'
                              : data.metrics.productionComplexity === 'medium'
                                ? 'bg-warning-600/20 text-warning-300'
                                : 'bg-success-600/20 text-success-300'
                          }`}
                        >
                          {data.metrics.productionComplexity} complexity
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations Preview */}
            {report.summary.recommendations.length > 0 && (
              <div>
                <h5 className="font-medium text-slate-200 mb-2">
                  Key Recommendations:
                </h5>
                <ul className="space-y-1">
                  {report.summary.recommendations.map((rec, index) => (
                    <li
                      key={index}
                      className="flex items-start space-x-2 text-sm"
                    >
                      <span className="text-primary-400 mt-1">•</span>
                      <span className="text-slate-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleExport}
          disabled={isExporting || scripts.length === 0}
          loading={isExporting}
          className="px-6"
        >
          {isExporting
            ? 'Generating Report...'
            : `Export as ${exportFormat.toUpperCase()}`}
        </Button>
      </div>
    </div>
  );
};
