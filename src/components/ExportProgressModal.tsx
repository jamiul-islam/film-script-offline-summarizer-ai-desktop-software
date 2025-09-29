import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimations } from './ThemeProvider';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import type { ExportProgress } from '../services/export';

interface ExportProgressModalProps {
  isOpen: boolean;
  progress: ExportProgress | null;
  onClose: () => void;
  onCancel?: () => void;
  title?: string;
}

const getStageIcon = (stage: ExportProgress['stage']): string => {
  switch (stage) {
    case 'preparing':
      return '📋';
    case 'formatting':
      return '📝';
    case 'generating':
      return '⚙️';
    case 'complete':
      return '✅';
    case 'error':
      return '❌';
    default:
      return '📄';
  }
};

const getStageColor = (stage: ExportProgress['stage']): string => {
  switch (stage) {
    case 'preparing':
      return 'text-blue-400';
    case 'formatting':
      return 'text-yellow-400';
    case 'generating':
      return 'text-purple-400';
    case 'complete':
      return 'text-green-400';
    case 'error':
      return 'text-red-400';
    default:
      return 'text-slate-400';
  }
};

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  progress,
  onClose,
  onCancel,
  title = 'Exporting Summary',
}) => {
  const { withAnimation } = useAnimations();

  if (!isOpen) return null;

  const canCancel =
    progress?.stage !== 'complete' && progress?.stage !== 'error';
  const isComplete = progress?.stage === 'complete';
  const hasError = progress?.stage === 'error';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => {
            if (e.target === e.currentTarget && (isComplete || hasError)) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <Card variant="elevated" className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-100">
                    {title}
                  </h3>
                  {(isComplete || hasError) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="text-slate-400 hover:text-slate-300"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {progress && (
                  <>
                    {/* Stage Indicator */}
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {getStageIcon(progress.stage)}
                      </span>
                      <div className="flex-1">
                        <div
                          className={`font-medium ${getStageColor(progress.stage)}`}
                        >
                          {progress.stage.charAt(0).toUpperCase() +
                            progress.stage.slice(1)}
                        </div>
                        <div className="text-sm text-slate-400">
                          {progress.message}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {!hasError && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-slate-300">
                            {progress.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.progress}%` }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {hasError && progress.error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <span className="text-red-400 text-lg">⚠️</span>
                          <div>
                            <div className="font-medium text-red-300 mb-1">
                              Export Failed
                            </div>
                            <div className="text-sm text-red-400">
                              {progress.error}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Success Message */}
                    {isComplete && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-green-400 text-lg">🎉</span>
                          <div className="text-green-300">
                            Export completed successfully!
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                  {canCancel && onCancel && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onCancel}
                      className={withAnimation('', 'scaleIn')}
                    >
                      Cancel
                    </Button>
                  )}

                  {(isComplete || hasError) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={onClose}
                      className={withAnimation('', 'scaleIn')}
                    >
                      {hasError ? 'Close' : 'Done'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
