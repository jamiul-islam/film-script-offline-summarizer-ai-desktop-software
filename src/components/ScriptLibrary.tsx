import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent } from './ui/Card';
import type { ScriptWithSummary, ScriptStatus } from '../types/script';

interface ScriptLibraryProps {
  scripts: ScriptWithSummary[];
  onScriptSelect?: (script: ScriptWithSummary) => void;
  onScriptDelete?: (scriptId: string) => void;
  onScriptRate?: (scriptId: string, rating: number) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'date' | 'title' | 'rating' | 'size';
type SortDirection = 'asc' | 'desc';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const getStatusColor = (status: ScriptStatus): string => {
  switch (status) {
    case 'uploaded': return 'text-blue-400';
    case 'processing': return 'text-yellow-400';
    case 'analyzed': return 'text-green-400';
    case 'error': return 'text-red-400';
    default: return 'text-slate-400';
  }
};

const getStatusIcon = (status: ScriptStatus): string => {
  switch (status) {
    case 'uploaded': return '📄';
    case 'processing': return '⏳';
    case 'analyzed': return '✅';
    case 'error': return '❌';
    default: return '📄';
  }
};

const StarRating: React.FC<{
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
}> = ({ rating, onRatingChange, readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className={`text-lg transition-colors ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } ${
            star <= (hoverRating || rating)
              ? 'text-yellow-400'
              : 'text-slate-600'
          }`}
          onClick={() => !readonly && onRatingChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          disabled={readonly}
        >
          ⭐
        </button>
      ))}
    </div>
  );
};

export const ScriptLibrary: React.FC<ScriptLibraryProps> = ({
  scripts,
  onScriptSelect,
  onScriptDelete,
  onScriptRate,
  className = '',
}) => {
  const { animationsEnabled } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get all unique tags from scripts
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    scripts.forEach(script => {
      script.evaluation?.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [scripts]);

  // Filter and sort scripts
  const filteredAndSortedScripts = useMemo(() => {
    let filtered = scripts.filter(script => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        script.evaluation?.notes.toLowerCase().includes(searchQuery.toLowerCase());

      // Tag filter
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(tag => script.evaluation?.tags.includes(tag));

      return matchesSearch && matchesTags;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = a.uploadedAt.getTime() - b.uploadedAt.getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'rating':
          comparison = (a.evaluation?.rating || 0) - (b.evaluation?.rating || 0);
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [scripts, searchQuery, selectedTags, sortBy, sortDirection]);

  const handleSortChange = useCallback((newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  }, [sortBy]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const ScriptCard: React.FC<{ script: ScriptWithSummary; index: number }> = ({ script, index }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        duration: 0.3, 
        delay: animationsEnabled ? index * 0.05 : 0 
      }}
      whileHover={animationsEnabled ? { y: -4, scale: 1.02 } : {}}
      className="h-full"
    >
      <Card 
        variant="hover" 
        className="h-full cursor-pointer"
        onClick={() => onScriptSelect?.(script)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getStatusIcon(script.status)}</span>
              <div>
                <h3 className="font-semibold text-slate-100 truncate">
                  {script.title}
                </h3>
                <p className={`text-sm ${getStatusColor(script.status)}`}>
                  {script.status.charAt(0).toUpperCase() + script.status.slice(1)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onScriptDelete?.(script.id);
                }}
                className="text-red-400 hover:text-red-300"
              >
                🗑️
              </Button>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Size: {formatFileSize(script.fileSize)}</span>
              <span>{script.fileType.toUpperCase()}</span>
            </div>
            <div className="text-sm text-slate-400">
              Words: {script.wordCount.toLocaleString()}
            </div>
            <div className="text-sm text-slate-400">
              Uploaded: {formatDate(script.uploadedAt)}
            </div>
          </div>

          {script.evaluation && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <StarRating
                  rating={script.evaluation.rating}
                  onRatingChange={(rating) => onScriptRate?.(script.id, rating)}
                />
              </div>
              
              {script.evaluation.notes && (
                <p className="text-sm text-slate-300 line-clamp-2">
                  {script.evaluation.notes}
                </p>
              )}
              
              {script.evaluation.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {script.evaluation.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-primary-600/20 text-primary-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {script.evaluation.tags.length > 3 && (
                    <span className="text-xs text-slate-400">
                      +{script.evaluation.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const ScriptListItem: React.FC<{ script: ScriptWithSummary; index: number }> = ({ script, index }) => (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ 
        duration: 0.3, 
        delay: animationsEnabled ? index * 0.02 : 0 
      }}
      whileHover={animationsEnabled ? { x: 4 } : {}}
    >
      <Card 
        variant="hover" 
        className="cursor-pointer"
        onClick={() => onScriptSelect?.(script)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <span className="text-2xl">{getStatusIcon(script.status)}</span>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-100 truncate">
                  {script.title}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  <span className={getStatusColor(script.status)}>
                    {script.status.charAt(0).toUpperCase() + script.status.slice(1)}
                  </span>
                  <span>{formatFileSize(script.fileSize)}</span>
                  <span>{script.wordCount.toLocaleString()} words</span>
                  <span>{formatDate(script.uploadedAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {script.evaluation && (
                <StarRating
                  rating={script.evaluation.rating}
                  onRatingChange={(rating) => onScriptRate?.(script.id, rating)}
                />
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onScriptDelete?.(script.id);
                }}
                className="text-red-400 hover:text-red-300"
              >
                🗑️
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search scripts by title or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              ⊞
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              ☰
            </Button>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex flex-wrap gap-2">
          {(['date', 'title', 'rating', 'size'] as SortOption[]).map(option => (
            <Button
              key={option}
              variant={sortBy === option ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleSortChange(option)}
              className="capitalize"
            >
              {option}
              {sortBy === option && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-300">Filter by tags:</h4>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <Button
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => toggleTag(tag)}
                  className="text-xs"
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          {filteredAndSortedScripts.length} of {scripts.length} scripts
        </span>
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
          >
            Clear search
          </Button>
        )}
      </div>

      {/* Scripts Display */}
      <AnimatePresence mode="wait">
        {filteredAndSortedScripts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              {scripts.length === 0 ? 'No scripts yet' : 'No scripts match your filters'}
            </h3>
            <p className="text-slate-400">
              {scripts.length === 0 
                ? 'Upload your first script to get started'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredAndSortedScripts.map((script, index) => (
                <ScriptCard key={script.id} script={script} index={index} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div layout className="space-y-3">
            <AnimatePresence>
              {filteredAndSortedScripts.map((script, index) => (
                <ScriptListItem key={script.id} script={script} index={index} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};