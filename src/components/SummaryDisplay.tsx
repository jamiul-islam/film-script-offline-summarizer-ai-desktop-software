import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';

interface ProcessedScript {
  id: string;
  title: string;
  content: string;
  filePath: string;
  summary?: any;
}

interface SummaryDisplayProps {
  script: ProcessedScript;
  summary?: any;
  className?: string;
}

const getWordCount = (content: string): number => {
  return content.trim().split(/\s+/).length;
};

export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({
  script,
  summary,
  className = '',
}) => {
  const { animationsEnabled } = useTheme();

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">
                  {script.title}
                </h2>
                <p className="text-slate-400 mt-1">Script Analysis</p>
              </div>
              <div className="text-right text-sm text-slate-400">
                <div>
                  Words: {getWordCount(script.content).toLocaleString()}
                </div>
                <div>Status: {summary ? 'Analyzed' : 'Uploaded'}</div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Content */}
      {summary ? (
        <div className="space-y-6">
          {/* Plot Overview */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-100 flex items-center">
                <span className="mr-2">📖</span>
                Plot Overview
              </h3>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 leading-relaxed">
                {summary.plotOverview || 'No plot overview available'}
              </p>
            </CardContent>
          </Card>

          {/* Characters */}
          {summary.mainCharacters && summary.mainCharacters.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-100 flex items-center">
                  <span className="mr-2">🎭</span>
                  Characters ({summary.mainCharacters.length})
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {summary.mainCharacters.map(
                    (character: unknown, index: number) => (
                      <div
                        key={index}
                        className="bg-slate-800/30 p-4 rounded-lg"
                      >
                        <h4 className="font-semibold text-slate-100 mb-2">
                          {character.name || `Character ${index + 1}`}
                        </h4>
                        <p className="text-slate-300 text-sm">
                          {character.description || 'No description available'}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Themes */}
          {summary.themes && summary.themes.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-100 flex items-center">
                  <span className="mr-2">🎨</span>
                  Themes
                </h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {summary.themes.map((theme: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-600/20 text-primary-300 rounded-full text-sm"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Genre */}
          {summary.genre && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-100 flex items-center">
                  <span className="mr-2">🎬</span>
                  Genre
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">{summary.genre}</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              No Summary Available
            </h3>
            <p className="text-slate-400">
              This script hasn't been analyzed yet or the analysis is still in
              progress.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Script Content Preview */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center">
            <span className="mr-2">📄</span>
            Script Preview
          </h3>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-900 p-4 rounded-lg max-h-96 overflow-y-auto">
            <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono">
              {script.content.substring(0, 2000)}
              {script.content.length > 2000 && '...'}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
