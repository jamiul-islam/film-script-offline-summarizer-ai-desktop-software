import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ScriptRating } from './ScriptRating';
import { ComparisonExport } from './ComparisonExport';
import { ScriptWithSummary, ScriptEvaluation } from '../types';

interface ScriptComparisonProps {
  scripts: ScriptWithSummary[];
  selectedScripts?: ScriptWithSummary[];
  onScriptSelect?: (scripts: ScriptWithSummary[]) => void;
  className?: string;
}

interface ComparisonMetrics {
  similarity: number;
  genreMatch: boolean;
  themeOverlap: string[];
  characterCountDiff: number;
  budgetCompatibility: string;
}

export const ScriptComparison: React.FC<ScriptComparisonProps> = ({
  scripts,
  selectedScripts = [],
  onScriptSelect,
  className = '',
}) => {
  const { animationsEnabled } = useTheme();
  const [comparisonMode, setComparisonMode] = useState<
    'side-by-side' | 'overlay' | 'rating' | 'export'
  >('side-by-side');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightDifferences, setHighlightDifferences] = useState(true);
  const [evaluations, setEvaluations] = useState<
    Record<string, ScriptEvaluation>
  >({});
  const [activeRatingScript, setActiveRatingScript] =
    useState<ScriptWithSummary | null>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  // Filter available scripts for selection
  const availableScripts = scripts.filter(
    script =>
      script.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      script.summary && // Only show scripts with summaries
      !selectedScripts.find(selected => selected.id === script.id)
  );

  // Calculate comparison metrics
  const calculateMetrics = (
    script1: ScriptWithSummary,
    script2: ScriptWithSummary
  ): ComparisonMetrics => {
    if (!script1.summary || !script2.summary) {
      return {
        similarity: 0,
        genreMatch: false,
        themeOverlap: [],
        characterCountDiff: 0,
        budgetCompatibility: 'unknown',
      };
    }

    const themes1 = script1.summary.themes || [];
    const themes2 = script2.summary.themes || [];
    const themeOverlap = themes1.filter(theme => themes2.includes(theme));

    const similarity =
      themeOverlap.length / Math.max(themes1.length, themes2.length, 1);
    const genreMatch = script1.summary.genre === script2.summary.genre;
    const characterCountDiff = Math.abs(
      (script1.summary.mainCharacters?.length || 0) -
        (script2.summary.mainCharacters?.length || 0)
    );

    return {
      similarity: Math.round(similarity * 100),
      genreMatch,
      themeOverlap,
      characterCountDiff,
      budgetCompatibility: genreMatch ? 'compatible' : 'different',
    };
  };

  // Synchronized scrolling
  const handleScroll = (
    source: 'left' | 'right',
    event: React.UIEvent<HTMLDivElement>
  ) => {
    const scrollTop = event.currentTarget.scrollTop;
    const target =
      source === 'left' ? rightScrollRef.current : leftScrollRef.current;

    if (target && target.scrollTop !== scrollTop) {
      target.scrollTop = scrollTop;
    }
  };

  const handleScriptSelection = (script: ScriptWithSummary) => {
    if (selectedScripts.length < 2) {
      const newSelection = [...selectedScripts, script];
      onScriptSelect?.(newSelection);
    }
  };

  const removeScript = (scriptId: string) => {
    const newSelection = selectedScripts.filter(
      script => script.id !== scriptId
    );
    onScriptSelect?.(newSelection);
  };

  const handleEvaluationChange = (evaluation: ScriptEvaluation) => {
    setEvaluations(prev => ({
      ...prev,
      [evaluation.scriptId]: evaluation,
    }));
  };

  const handleExport = async (format: 'pdf' | 'txt' | 'json', data: any) => {
    console.log('Exporting comparison report:', format, data);
    // Here you would implement the actual export functionality
    // For now, we'll just log it
    alert(
      `Export functionality would save ${format.toUpperCase()} report with ${data.scripts.length} scripts`
    );
  };

  const metrics =
    selectedScripts.length === 2
      ? calculateMetrics(selectedScripts[0], selectedScripts[1])
      : null;

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">
            Script Comparison
          </h2>
          <p className="text-slate-400 mt-1">
            Compare scripts side-by-side to identify similarities and
            differences
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={comparisonMode === 'side-by-side' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setComparisonMode('side-by-side')}
          >
            📊 Compare
          </Button>
          <Button
            variant={comparisonMode === 'overlay' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setComparisonMode('overlay')}
          >
            🔄 Overlay
          </Button>
          <Button
            variant={comparisonMode === 'rating' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setComparisonMode('rating')}
            disabled={selectedScripts.length === 0}
          >
            ⭐ Rate
          </Button>
          <Button
            variant={comparisonMode === 'export' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setComparisonMode('export')}
            disabled={selectedScripts.length === 0}
          >
            📤 Export
          </Button>
        </div>
      </div>

      {/* Script Selection */}
      {selectedScripts.length < 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">
                Select Scripts to Compare ({selectedScripts.length}/2)
              </h3>
              <div className="max-w-xs">
                <Input
                  type="text"
                  placeholder="Search scripts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableScripts.map(script => (
                <motion.div
                  key={script.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={animationsEnabled ? { scale: 1.02 } : {}}
                  whileTap={animationsEnabled ? { scale: 0.98 } : {}}
                >
                  <Card
                    variant="hover"
                    onClick={() => handleScriptSelection(script)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">📄</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-100 truncate">
                            {script.title}
                          </h4>
                          <p className="text-sm text-slate-400">
                            {script.summary?.genre || 'Unknown genre'}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {script.summary?.themes
                              ?.slice(0, 2)
                              .map((theme, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-primary-600/20 text-primary-300 rounded text-xs"
                                >
                                  {theme}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {availableScripts.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-slate-400">
                  {searchQuery
                    ? 'No scripts match your search'
                    : 'No analyzed scripts available for comparison'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected Scripts Display */}
      {selectedScripts.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {selectedScripts.map((script, index) => (
            <motion.div
              key={script.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card
                variant="elevated"
                className="inline-flex items-center space-x-3 px-4 py-2"
              >
                <span className="text-lg">📄</span>
                <span className="font-medium text-slate-100">
                  {script.title}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeScript(script.id)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  ✕
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Comparison Metrics */}
      {metrics && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100 flex items-center">
                <span className="mr-2">📊</span>
                Comparison Metrics
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHighlightDifferences(!highlightDifferences)}
                className={
                  highlightDifferences ? 'text-primary-400' : 'text-slate-400'
                }
              >
                {highlightDifferences
                  ? '🔍 Highlighting On'
                  : '🔍 Highlighting Off'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-400">
                  {metrics.similarity}%
                </div>
                <div className="text-sm text-slate-400">Theme Similarity</div>
              </div>

              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${
                    metrics.genreMatch ? 'text-success-400' : 'text-warning-400'
                  }`}
                >
                  {metrics.genreMatch ? '✓' : '✗'}
                </div>
                <div className="text-sm text-slate-400">Genre Match</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-accent-400">
                  {metrics.themeOverlap.length}
                </div>
                <div className="text-sm text-slate-400">Shared Themes</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-slate-300">
                  ±{metrics.characterCountDiff}
                </div>
                <div className="text-sm text-slate-400">Character Diff</div>
              </div>
            </div>

            {metrics.themeOverlap.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">
                  Shared Themes:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {metrics.themeOverlap.map((theme, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-success-600/20 text-success-300 rounded-full text-sm"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Area */}
      {selectedScripts.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={comparisonMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {comparisonMode === 'side-by-side' &&
              selectedScripts.length === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {selectedScripts.map((script, scriptIndex) => (
                    <div key={script.id} className="space-y-4">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-100">
                              {script.title}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setActiveRatingScript(script);
                                setComparisonMode('rating');
                              }}
                            >
                              ⭐ Rate
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div
                            ref={
                              scriptIndex === 0 ? leftScrollRef : rightScrollRef
                            }
                            onScroll={e =>
                              handleScroll(
                                scriptIndex === 0 ? 'left' : 'right',
                                e
                              )
                            }
                            className="max-h-96 overflow-y-auto space-y-4"
                          >
                            {/* Plot Overview */}
                            <div>
                              <h4 className="font-medium text-slate-200 mb-2">
                                Plot Overview
                              </h4>
                              <p className="text-slate-300 text-sm leading-relaxed">
                                {script.summary?.plotOverview ||
                                  'No plot overview available'}
                              </p>
                            </div>

                            {/* Characters */}
                            <div>
                              <h4 className="font-medium text-slate-200 mb-2">
                                Characters (
                                {script.summary?.mainCharacters?.length || 0})
                              </h4>
                              <div className="space-y-2">
                                {script.summary?.mainCharacters
                                  ?.slice(0, 3)
                                  .map((character: any, charIndex: number) => (
                                    <div
                                      key={charIndex}
                                      className="bg-slate-800/30 p-2 rounded"
                                    >
                                      <div className="font-medium text-slate-100 text-sm">
                                        {character.name}
                                      </div>
                                      <div className="text-slate-400 text-xs">
                                        {character.description}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>

                            {/* Themes */}
                            <div>
                              <h4 className="font-medium text-slate-200 mb-2">
                                Themes
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {script.summary?.themes?.map(
                                  (theme: string, themeIndex: number) => (
                                    <span
                                      key={themeIndex}
                                      className={`px-2 py-1 rounded text-xs ${
                                        highlightDifferences &&
                                        metrics?.themeOverlap.includes(theme)
                                          ? 'bg-success-600/20 text-success-300 ring-1 ring-success-500/30'
                                          : 'bg-slate-700 text-slate-300'
                                      }`}
                                    >
                                      {theme}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>

                            {/* Genre */}
                            <div>
                              <h4 className="font-medium text-slate-200 mb-2">
                                Genre
                              </h4>
                              <span
                                className={`px-3 py-1 rounded text-sm ${
                                  highlightDifferences && metrics?.genreMatch
                                    ? 'bg-success-600/20 text-success-300 ring-1 ring-success-500/30'
                                    : 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {script.summary?.genre || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}

            {comparisonMode === 'overlay' && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Overlay Comparison
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {selectedScripts.length === 2 ? (
                      <div className="relative">
                        {/* Overlay comparison with tabs */}
                        <div className="flex space-x-4 mb-6">
                          <Button variant="primary" size="sm">
                            Plot Overview
                          </Button>
                          <Button variant="ghost" size="sm">
                            Characters
                          </Button>
                          <Button variant="ghost" size="sm">
                            Themes
                          </Button>
                          <Button variant="ghost" size="sm">
                            Production
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {selectedScripts.map((script, scriptIndex) => (
                            <Card key={script.id} variant="elevated">
                              <CardHeader>
                                <h4 className="font-semibold text-slate-100">
                                  {script.title}
                                </h4>
                              </CardHeader>
                              <CardContent>
                                <p className="text-slate-300 text-sm">
                                  {script.summary?.plotOverview ||
                                    'No plot overview available'}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-3">📊</div>
                        <p className="text-slate-400">
                          Select 2 scripts to use overlay comparison
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {comparisonMode === 'rating' && (
              <div className="space-y-6">
                {activeRatingScript ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-slate-100">
                        Rating: {activeRatingScript.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveRatingScript(null);
                          setComparisonMode('side-by-side');
                        }}
                      >
                        ← Back to Comparison
                      </Button>
                    </div>
                    <ScriptRating
                      script={activeRatingScript}
                      evaluation={evaluations[activeRatingScript.id]}
                      onEvaluationChange={handleEvaluationChange}
                    />
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold text-slate-100">
                        Select a Script to Rate
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedScripts.map(script => (
                          <Card
                            key={script.id}
                            variant="hover"
                            onClick={() => setActiveRatingScript(script)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">⭐</span>
                                <div>
                                  <h4 className="font-semibold text-slate-100">
                                    {script.title}
                                  </h4>
                                  <p className="text-sm text-slate-400">
                                    {evaluations[script.id]
                                      ? `Rated ${evaluations[script.id].rating}/5 stars`
                                      : 'Not rated yet'}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {comparisonMode === 'export' && (
              <ComparisonExport
                scripts={selectedScripts}
                evaluations={evaluations}
                onExport={handleExport}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Help text when no scripts selected */}
      {selectedScripts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">⚖️</div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              Start Comparing Scripts
            </h3>
            <p className="text-slate-400">
              Select scripts from above to begin comparing them side-by-side
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
