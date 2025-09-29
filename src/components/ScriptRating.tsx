import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ScriptWithSummary, ScriptEvaluation } from '../types';

interface ScriptRatingProps {
  script: ScriptWithSummary;
  evaluation?: ScriptEvaluation;
  onEvaluationChange?: (evaluation: ScriptEvaluation) => void;
  className?: string;
}

interface TagSuggestion {
  tag: string;
  category: 'genre' | 'mood' | 'production' | 'quality';
}

const commonTags: TagSuggestion[] = [
  { tag: 'high-budget', category: 'production' },
  { tag: 'low-budget', category: 'production' },
  { tag: 'character-driven', category: 'quality' },
  { tag: 'action-packed', category: 'genre' },
  { tag: 'dialogue-heavy', category: 'quality' },
  { tag: 'visual-effects', category: 'production' },
  { tag: 'ensemble-cast', category: 'production' },
  { tag: 'single-location', category: 'production' },
  { tag: 'period-piece', category: 'production' },
  { tag: 'contemporary', category: 'production' },
  { tag: 'dark', category: 'mood' },
  { tag: 'uplifting', category: 'mood' },
  { tag: 'suspenseful', category: 'mood' },
  { tag: 'comedic', category: 'mood' },
  { tag: 'emotional', category: 'mood' },
  { tag: 'fast-paced', category: 'quality' },
  { tag: 'slow-burn', category: 'quality' },
  { tag: 'twist-ending', category: 'quality' },
  { tag: 'strong-female-lead', category: 'quality' },
  { tag: 'ensemble-piece', category: 'quality' },
];

export const ScriptRating: React.FC<ScriptRatingProps> = ({
  script,
  evaluation,
  onEvaluationChange,
  className = '',
}) => {
  const { animationsEnabled } = useTheme();
  const [rating, setRating] = useState(evaluation?.rating || 0);
  const [notes, setNotes] = useState(evaluation?.notes || '');
  const [tags, setTags] = useState<string[]>(evaluation?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [rating, notes, tags, hasUnsavedChanges]);

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    setHasUnsavedChanges(true);
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    setHasUnsavedChanges(true);
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      const newTags = [...tags, tag.trim()];
      setTags(newTags);
      setNewTag('');
      setShowTagSuggestions(false);
      setHasUnsavedChanges(true);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    const newEvaluation: ScriptEvaluation = {
      id: evaluation?.id || `eval_${script.id}_${Date.now()}`,
      scriptId: script.id,
      rating,
      notes,
      tags,
      createdAt: evaluation?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onEvaluationChange?.(newEvaluation);
    setHasUnsavedChanges(false);
  };

  const hasChanges = () => {
    return (
      rating !== (evaluation?.rating || 0) ||
      notes !== (evaluation?.notes || '') ||
      JSON.stringify(tags) !== JSON.stringify(evaluation?.tags || [])
    );
  };

  const filteredTagSuggestions = commonTags.filter(
    suggestion =>
      suggestion.tag.toLowerCase().includes(newTag.toLowerCase()) &&
      !tags.includes(suggestion.tag)
  );

  const getTagCategoryColor = (category: TagSuggestion['category']) => {
    switch (category) {
      case 'genre':
        return 'bg-primary-600/20 text-primary-300';
      case 'mood':
        return 'bg-accent-600/20 text-accent-300';
      case 'production':
        return 'bg-warning-600/20 text-warning-300';
      case 'quality':
        return 'bg-success-600/20 text-success-300';
      default:
        return 'bg-slate-600/20 text-slate-300';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-100">
            Script Evaluation
          </h3>
          <p className="text-slate-400 mt-1">
            Rate and add notes for {script.title}
          </p>
        </div>
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-2"
          >
            <div className="w-2 h-2 bg-warning-400 rounded-full animate-pulse" />
            <span className="text-sm text-warning-400">Auto-saving...</span>
          </motion.div>
        )}
      </div>

      {/* Rating */}
      <Card>
        <CardHeader>
          <h4 className="text-lg font-semibold text-slate-100 flex items-center">
            <span className="mr-2">⭐</span>
            Rating
          </h4>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map(star => (
              <motion.button
                key={star}
                className={`text-3xl transition-all duration-200 ${
                  star <= rating
                    ? 'text-yellow-400 drop-shadow-lg'
                    : 'text-slate-600 hover:text-yellow-300'
                }`}
                onClick={() => handleRatingChange(star)}
                whileHover={
                  animationsEnabled
                    ? {
                        scale: 1.2,
                        transition: { duration: 0.2 },
                      }
                    : {}
                }
                whileTap={animationsEnabled ? { scale: 0.9 } : {}}
              >
                ⭐
              </motion.button>
            ))}
            <div className="ml-4 text-slate-300">
              {rating > 0 ? (
                <span className="font-medium">
                  {rating}/5 stars
                  {rating === 5 && ' - Exceptional!'}
                  {rating === 4 && ' - Great'}
                  {rating === 3 && ' - Good'}
                  {rating === 2 && ' - Fair'}
                  {rating === 1 && ' - Poor'}
                </span>
              ) : (
                <span className="text-slate-400">Click to rate</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <h4 className="text-lg font-semibold text-slate-100 flex items-center">
            <span className="mr-2">📝</span>
            Notes
          </h4>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={e => handleNotesChange(e.target.value)}
            placeholder="Add your thoughts about this script..."
            className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none transition-colors"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-slate-400">
              {notes.length} characters
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges()}
            >
              Save Notes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <h4 className="text-lg font-semibold text-slate-100 flex items-center">
            <span className="mr-2">🏷️</span>
            Tags ({tags.length})
          </h4>
        </CardHeader>
        <CardContent>
          {/* Current Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag, index) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-700 text-slate-200 rounded-full text-sm"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </motion.span>
              ))}
            </div>
          )}

          {/* Add New Tag */}
          <div className="relative">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Add a tag..."
                value={newTag}
                onChange={e => {
                  setNewTag(e.target.value);
                  setShowTagSuggestions(e.target.value.length > 0);
                }}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(newTag);
                  }
                }}
                className="flex-1"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAddTag(newTag)}
                disabled={!newTag.trim() || tags.includes(newTag.trim())}
              >
                Add
              </Button>
            </div>

            {/* Tag Suggestions */}
            {showTagSuggestions && filteredTagSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
              >
                {filteredTagSuggestions.slice(0, 8).map(suggestion => (
                  <button
                    key={suggestion.tag}
                    onClick={() => handleAddTag(suggestion.tag)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700 transition-colors flex items-center justify-between"
                  >
                    <span className="text-slate-200">{suggestion.tag}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${getTagCategoryColor(suggestion.category)}`}
                    >
                      {suggestion.category}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Quick Tag Categories */}
          <div className="mt-4">
            <h5 className="text-sm font-medium text-slate-300 mb-2">
              Quick Add:
            </h5>
            <div className="flex flex-wrap gap-2">
              {['genre', 'mood', 'production', 'quality'].map(category => {
                const categoryTags = commonTags
                  .filter(t => t.category === category && !tags.includes(t.tag))
                  .slice(0, 3);

                return categoryTags.map(suggestion => (
                  <button
                    key={suggestion.tag}
                    onClick={() => handleAddTag(suggestion.tag)}
                    className={`px-2 py-1 rounded text-xs transition-colors hover:opacity-80 ${getTagCategoryColor(suggestion.category)}`}
                  >
                    {suggestion.tag}
                  </button>
                ));
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {(rating > 0 || notes.length > 0 || tags.length > 0) && (
        <Card variant="elevated">
          <CardHeader>
            <h4 className="text-lg font-semibold text-slate-100 flex items-center">
              <span className="mr-2">📊</span>
              Evaluation Summary
            </h4>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Overall Rating:</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={
                        star <= rating ? 'text-yellow-400' : 'text-slate-600'
                      }
                    >
                      ⭐
                    </span>
                  ))}
                  <span className="ml-2 text-slate-200 font-medium">
                    {rating}/5
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Notes:</span>
                <span className="text-slate-200">
                  {notes.length > 0 ? `${notes.length} characters` : 'None'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Tags:</span>
                <span className="text-slate-200">
                  {tags.length} tag{tags.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
