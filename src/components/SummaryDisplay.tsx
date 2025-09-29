import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, useAnimations } from './ThemeProvider';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { ExportProgressModal } from './ExportProgressModal';
import { useExport } from '../hooks/useExport';
import type { ScriptSummary, Character, ProductionNote, Priority, ProductionCategory } from '../types/summary';

interface SummaryDisplayProps {
  summary: ScriptSummary;
  className?: string;
  onExport?: (format: 'pdf' | 'txt') => void;
  onExportComplete?: (result: string, format: 'pdf' | 'txt') => void;
}

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  children,
  defaultExpanded = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { withAnimation } = useAnimations();

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="p-0">
        <Button
          variant="ghost"
          className="w-full justify-between p-4 text-left hover:bg-slate-800/50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl">{icon}</span>
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          </div>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-400"
          >
            ▼
          </motion.span>
        </Button>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <CardContent className={withAnimation('p-4 pt-0', 'fadeIn')}>
              {children}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

const getPriorityColor = (priority: Priority): string => {
  switch (priority) {
    case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30';
    default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
};

const getCategoryIcon = (category: ProductionCategory): string => {
  switch (category) {
    case 'budget': return '💰';
    case 'location': return '📍';
    case 'cast': return '🎭';
    case 'technical': return '⚙️';
    case 'legal': return '⚖️';
    case 'scheduling': return '📅';
    case 'equipment': return '🎬';
    case 'post-production': return '🎞️';
    default: return '📝';
  }
};

const getThemeColors = (): string[] => [
  'bg-blue-500/20 text-blue-300',
  'bg-purple-500/20 text-purple-300',
  'bg-green-500/20 text-green-300',
  'bg-pink-500/20 text-pink-300',
  'bg-indigo-500/20 text-indigo-300',
  'bg-teal-500/20 text-teal-300',
  'bg-orange-500/20 text-orange-300',
  'bg-cyan-500/20 text-cyan-300',
];

const CharacterCard: React.FC<{ character: Character; index: number }> = ({ character, index }) => {
  const { withAnimation } = useAnimations();
  
  const importanceColors = {
    protagonist: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    main: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    supporting: 'bg-green-500/20 text-green-300 border-green-500/30',
    minor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={withAnimation('', 'fadeIn')}
    >
      <Card variant="elevated" className="h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-slate-100 text-lg">{character.name}</h4>
            <span className={`px-2 py-1 rounded-full text-xs border ${importanceColors[character.importance]}`}>
              {character.importance}
            </span>
          </div>
          
          <p className="text-slate-300 text-sm mb-3 leading-relaxed">
            {character.description}
          </p>
          
          {character.characterArc && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                Character Arc
              </h5>
              <p className="text-slate-300 text-sm">{character.characterArc}</p>
            </div>
          )}
          
          {character.traits && character.traits.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                Key Traits
              </h5>
              <div className="flex flex-wrap gap-1">
                {character.traits.map((trait, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {character.relationships.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                Relationships
              </h5>
              <div className="space-y-1">
                {character.relationships.map((relationship, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-slate-300 bg-slate-800/30 px-2 py-1 rounded"
                  >
                    {relationship}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {character.ageRange && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <span className="text-xs text-slate-400">Age: {character.ageRange}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ProductionNoteCard: React.FC<{ note: ProductionNote; index: number }> = ({ note, index }) => {
  const { withAnimation } = useAnimations();
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={withAnimation('', 'slideInLeft')}
    >
      <Card className="border-l-4 border-l-slate-600">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getCategoryIcon(note.category)}</span>
              <span className="text-sm font-medium text-slate-300 capitalize">
                {note.category}
              </span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(note.priority)}`}>
              {note.priority}
            </span>
          </div>
          
          <p className="text-slate-300 text-sm mb-3 leading-relaxed">
            {note.content}
          </p>
          
          {note.budgetImpact && (
            <div className="mb-2">
              <span className="text-xs text-slate-400">
                Budget Impact: <span className="text-slate-300">{note.budgetImpact}</span>
              </span>
            </div>
          )}
          
          {note.requirements && note.requirements.length > 0 && (
            <div>
              <h6 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                Requirements
              </h6>
              <ul className="space-y-1">
                {note.requirements.map((req, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start">
                    <span className="text-slate-500 mr-2">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({
  summary,
  className = '',
  onExport,
  onExportComplete,
}) => {
  const { animationsEnabled } = useTheme();
  const { withAnimation } = useAnimations();
  const themeColors = getThemeColors();
  
  // Export functionality
  const { exportSummary, isExporting, progress, error, clearError } = useExport();
  const [showExportModal, setShowExportModal] = useState(false);

  // Group production notes by priority for better organization
  const groupedNotes = useMemo(() => {
    const groups: Record<Priority, ProductionNote[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };
    
    summary.productionNotes.forEach(note => {
      groups[note.priority].push(note);
    });
    
    return groups;
  }, [summary.productionNotes]);

  // Character relationship visualization data
  const characterRelationships = useMemo(() => {
    const relationships: Array<{ from: string; to: string; relationship: string }> = [];
    
    summary.mainCharacters.forEach(character => {
      character.relationships.forEach(rel => {
        // Parse relationship strings like "Mentor to John" or "Enemy of Sarah"
        const match = rel.match(/^(.+?)\s+(?:to|of|with)\s+(.+)$/i);
        if (match) {
          relationships.push({
            from: character.name,
            to: match[2],
            relationship: match[1],
          });
        }
      });
    });
    
    return relationships;
  }, [summary.mainCharacters]);

  // Handle export functionality
  const handleExport = async (format: 'pdf' | 'txt') => {
    // Call legacy onExport prop if provided
    if (onExport) {
      onExport(format);
      return;
    }

    // Use new export service
    setShowExportModal(true);
    clearError();

    const result = await exportSummary(summary, {
      format,
      includeMetadata: true,
      includeProductionNotes: true,
      includeCharacterDetails: true,
    });

    if (result && onExportComplete) {
      onExportComplete(result, format);
    }
  };

  const handleCloseExportModal = () => {
    setShowExportModal(false);
    clearError();
  };

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Summary Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={withAnimation('', 'slideInDown')}
      >
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Script Summary</h2>
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  <span>Generated: {new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(summary.createdAt)}</span>
                  <span>Model: {summary.modelUsed}</span>
                  {summary.genre && <span>Genre: {summary.genre}</span>}
                </div>
              </div>
              
              {(onExport || onExportComplete) && (
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExport('txt')}
                    disabled={isExporting}
                    loading={isExporting && progress?.stage !== 'complete'}
                  >
                    📄 Export TXT
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting}
                    loading={isExporting && progress?.stage !== 'complete'}
                  >
                    📑 Export PDF
                  </Button>
                </div>
              )}
            </div>
            
            {summary.estimatedBudget && (
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-600/20 text-primary-300">
                  💰 {summary.estimatedBudget.charAt(0).toUpperCase() + summary.estimatedBudget.slice(1)} Budget
                </span>
              </div>
            )}
            
            {summary.targetAudience && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-400 mb-1">Target Audience</h4>
                <p className="text-slate-300">{summary.targetAudience}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Plot Overview */}
      <CollapsibleSection
        title="Plot Overview"
        icon="📖"
        defaultExpanded={true}
      >
        <div className="prose prose-invert max-w-none">
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
            {summary.plotOverview}
          </p>
        </div>
        
        {summary.toneAndStyle && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <h4 className="text-sm font-medium text-slate-400 mb-2">Tone & Style</h4>
            <p className="text-slate-300">{summary.toneAndStyle}</p>
          </div>
        )}
        
        {summary.keyScenes && summary.keyScenes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <h4 className="text-sm font-medium text-slate-400 mb-3">Key Scenes</h4>
            <div className="space-y-2">
              {summary.keyScenes.map((scene, index) => (
                <div
                  key={index}
                  className="bg-slate-800/30 p-3 rounded-lg border-l-2 border-primary-500/50"
                >
                  <p className="text-slate-300 text-sm">{scene}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Characters */}
      <CollapsibleSection
        title={`Characters (${summary.mainCharacters.length})`}
        icon="🎭"
        defaultExpanded={true}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.mainCharacters.map((character, index) => (
            <CharacterCard key={character.name} character={character} index={index} />
          ))}
        </div>
        
        {characterRelationships.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-700">
            <h4 className="text-sm font-medium text-slate-400 mb-3">Character Relationships</h4>
            <div className="space-y-2">
              {characterRelationships.map((rel, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 bg-slate-800/30 p-3 rounded-lg"
                >
                  <span className="font-medium text-slate-200">{rel.from}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-sm text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
                    {rel.relationship}
                  </span>
                  <span className="text-slate-500">→</span>
                  <span className="font-medium text-slate-200">{rel.to}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Themes */}
      <CollapsibleSection
        title={`Themes (${summary.themes.length})`}
        icon="🎨"
        defaultExpanded={true}
      >
        <div className="flex flex-wrap gap-3">
          {summary.themes.map((theme, index) => (
            <motion.span
              key={theme}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`px-4 py-2 rounded-full text-sm font-medium border ${
                themeColors[index % themeColors.length]
              }`}
            >
              {theme}
            </motion.span>
          ))}
        </div>
      </CollapsibleSection>

      {/* Production Notes */}
      <CollapsibleSection
        title={`Production Notes (${summary.productionNotes.length})`}
        icon="📋"
        defaultExpanded={false}
      >
        <div className="space-y-6">
          {(['critical', 'high', 'medium', 'low'] as Priority[]).map(priority => {
            const notes = groupedNotes[priority];
            if (notes.length === 0) return null;
            
            return (
              <div key={priority}>
                <h4 className={`text-sm font-medium mb-3 uppercase tracking-wide ${getPriorityColor(priority).split(' ')[1]}`}>
                  {priority} Priority ({notes.length})
                </h4>
                <div className="space-y-3">
                  {notes.map((note, index) => (
                    <ProductionNoteCard key={index} note={note} index={index} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        {summary.productionChallenges && summary.productionChallenges.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-700">
            <h4 className="text-sm font-medium text-slate-400 mb-3">Production Challenges</h4>
            <div className="space-y-2">
              {summary.productionChallenges.map((challenge, index) => (
                <div
                  key={index}
                  className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg"
                >
                  <p className="text-red-300 text-sm">{challenge}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Market Analysis */}
      {summary.marketability && (
        <CollapsibleSection
          title="Market Analysis"
          icon="📊"
          defaultExpanded={false}
        >
          <div className="bg-slate-800/30 p-4 rounded-lg">
            <p className="text-slate-300 leading-relaxed">{summary.marketability}</p>
          </div>
        </CollapsibleSection>
      )}

      {/* Export Progress Modal */}
      <ExportProgressModal
        isOpen={showExportModal}
        progress={progress}
        onClose={handleCloseExportModal}
        title="Exporting Summary"
      />
    </div>
  );
};