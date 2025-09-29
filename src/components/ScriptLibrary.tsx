import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent } from './ui/Card';

interface ProcessedScript {
  id: string;
  title: string;
  content: string;
  filePath: string;
  summary?: any;
}

interface ScriptLibraryProps {
  scripts: ProcessedScript[];
  onScriptSelect?: (script: ProcessedScript) => void;
  onScriptDelete?: (scriptId: string) => void;
  className?: string;
}

const getWordCount = (content: string): number => {
  return content.trim().split(/\s+/).length;
};

export const ScriptLibrary: React.FC<ScriptLibraryProps> = ({
  scripts,
  onScriptSelect,
  onScriptDelete,
  className = '',
}) => {
  const { animationsEnabled } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter scripts based on search
  const filteredScripts = scripts.filter(script =>
    script.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100">Script Library</h2>
        <div className="text-sm text-slate-400">
          {filteredScripts.length} of {scripts.length} scripts
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          type="text"
          placeholder="Search scripts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Scripts Display */}
      {filteredScripts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            {scripts.length === 0 ? 'No scripts yet' : 'No scripts match your search'}
          </h3>
          <p className="text-slate-400">
            {scripts.length === 0 
              ? 'Upload your first script to get started'
              : 'Try a different search term'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScripts.map((script, index) => (
            <motion.div
              key={script.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: animationsEnabled ? index * 0.1 : 0 
              }}
              whileHover={animationsEnabled ? { y: -4, scale: 1.02 } : {}}
            >
              <Card 
                variant="hover" 
                className="h-full cursor-pointer"
                onClick={() => onScriptSelect?.(script)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">
                        {script.summary ? '✅' : '📄'}
                      </span>
                      <div>
                        <h3 className="font-semibold text-slate-100 text-lg">
                          {script.title}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {script.summary ? 'Analyzed' : 'Uploaded'}
                        </p>
                      </div>
                    </div>
                    {onScriptDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete "${script.title}"?`)) {
                            onScriptDelete(script.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        🗑️
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-slate-400">
                    <div>
                      Words: {getWordCount(script.content).toLocaleString()}
                    </div>
                    <div className="truncate">
                      Path: {script.filePath.split('/').pop()}
                    </div>
                  </div>

                  {script.summary && (
                    <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-300 line-clamp-3">
                        {script.summary.plotOverview || 'Summary available'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};